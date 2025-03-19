import os
import shutil
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification, TrainingArguments, Trainer
from datasets import Dataset, ClassLabel
from transformers import default_data_collator
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
from datetime import datetime

# Load MongoDB credentials
load_dotenv()

MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME")

MONGO_URI = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_CLUSTER}/?retryWrites=true&w=majority&appName={MONGO_APP_NAME}"
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
db = client[MONGO_DB_NAME]
collection = db["user-feedback"]



def update_env_variable(key, value, env_file=".env"):
    """
    Updates (or adds if not present) a key-value pair in the .env file.
    """
    lines = []
    updated = False

    # Read the existing .env file
    with open(env_file, "r") as file:
        for line in file:
            # Check if the key already exists
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value}\n")  # Replace value
                updated = True
            else:
                lines.append(line)
    
    # If the key doesn't exist, add it
    if not updated:
        lines.append(f"{key}={value}\n")

    # Write back the updated data
    with open(env_file, "w") as file:
        file.writelines(lines)

    print(f"{key} updated successfully to: {value}")


# -------------------------------------------------
# Utility Functions
# -------------------------------------------------

def log_error(message):
    print(f"[ERROR] {message}")
    return {"error": message}

def check_corner_cases(new_samples):
    if not new_samples:
        return log_error("No new samples provided. Stopping execution.")
    return True

def update_mongo_ids(document_ids):
    """
    Updates MongoDB documents by setting 'need_for_train' to False
    for documents matching the provided list of IDs.
    """
    result = collection.update_many(
        {"_id": {"$in": document_ids}},
        {"$set": {"need_for_train": False}}
    )
    print(f"Updated {result.modified_count} document(s) in MongoDB.")


# -------------------------------------------------
# Data Preparation
# -------------------------------------------------
def prepare_dataset(new_samples, base_dir, eval_split=0.2):
    dataset = Dataset.from_list(new_samples)

    # ClassLabel feature for stratification
    unique_vals = sorted(list(set(dataset["label"])))
    label_feature = ClassLabel(names=[str(x) for x in unique_vals])

    processor = AutoImageProcessor.from_pretrained(base_dir)

    def preprocess_and_classlabel(example):
        enc = processor(images=example["image"])
        enc["labels"] = example["label"]
        return enc

    dataset = dataset.map(preprocess_and_classlabel, batched=True, batch_size=8)
    dataset = dataset.cast_column("labels", label_feature)
    split_dataset = dataset.train_test_split(test_size=eval_split, stratify_by_column="labels")

    return split_dataset["train"], split_dataset["test"]


# -------------------------------------------------
# Model Evaluation & Fine-tuning
# -------------------------------------------------
def evaluate_model(model, eval_ds, batch_size, model_dir):
    eval_args = TrainingArguments(
        output_dir=model_dir,
        per_device_eval_batch_size=batch_size,
        evaluation_strategy="no",
        logging_dir=model_dir
    )

    trainer = Trainer(
        model=model,
        args=eval_args,
        data_collator=default_data_collator,
        eval_dataset=eval_ds,
        compute_metrics=lambda eval_pred: {
            "accuracy": (torch.argmax(torch.tensor(eval_pred[0]), dim=-1)
                        == torch.tensor(eval_pred[1])).float().mean().item()
        }
    )
    return trainer.evaluate()["eval_accuracy"]


def train_model(train_ds, eval_ds, base_dir, num_epochs, batch_size):
    model = AutoModelForImageClassification.from_pretrained(base_dir)

    training_args = TrainingArguments(
        output_dir="temp_output",
        overwrite_output_dir=True,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_dir="temp_logs_new",
        logging_steps=10,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=default_data_collator,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        compute_metrics=lambda eval_pred: {
            "accuracy": (torch.argmax(torch.tensor(eval_pred[0]), dim=-1)
                        == torch.tensor(eval_pred[1])).float().mean().item()
        }
    )
    trainer.train()

    return trainer.evaluate()["eval_accuracy"]


# -------------------------------------------------
# Main Function - Fine-tune & Compare
# -------------------------------------------------
def short_finetune_and_compare(
    new_samples, 
    base_dir, 
    best_dir, 
    num_epochs=1, 
    batch_size=4, 
    eval_split=0.2,
    document_ids=[]
):
    # Step 1: Check Corner Cases
    if not check_corner_cases(new_samples):
        return

    # Step 2: Dataset Preparation
    train_ds, eval_ds = prepare_dataset(new_samples, base_dir, eval_split)

    # Step 3: Evaluate Old Model
    old_model = AutoModelForImageClassification.from_pretrained(base_dir)
    old_accuracy = evaluate_model(old_model, eval_ds, batch_size, "temp_eval_old")
    print(f"Old/Best model accuracy on eval set: {old_accuracy:.4f}")

    # Step 4: Train New Model
    new_accuracy = train_model(train_ds, eval_ds, base_dir, num_epochs, batch_size)
    print(f"New model accuracy on eval set: {new_accuracy:.4f}")

    # Step 5: Compare Old vs. New
    if new_accuracy > old_accuracy:
        print("New model outperforms the old/best model. Updating best model.")
        if os.path.exists(best_dir):
            shutil.rmtree(best_dir)
        shutil.copytree("temp_output", best_dir)
        
        update_env_variable(key='MODEL_DIR',value="finetuned_Beit")
    
    # Step 6: MongoDB Update for Used IDs
    if document_ids:
        update_mongo_ids(document_ids)
