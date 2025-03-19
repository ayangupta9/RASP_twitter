import glob
import os
from transformers import AutoImageProcessor, BeitForImageClassification
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import uuid
from bson.binary import Binary
from datetime import datetime
from dotenv import load_dotenv
from retraining import short_finetune_and_compare
from apscheduler.schedulers.background import BackgroundScheduler
from PIL import Image
import io

model_folder = f"{os.getenv('MODEL_DIR')}/"
model = BeitForImageClassification.from_pretrained(model_folder)
print(f'Model using weights from {model_folder}')
image_processor = AutoImageProcessor.from_pretrained(model_folder)

load_dotenv()

# Fetch values from environment variables
MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME")

# Construct MongoDB URI using a template string
MONGO_URI = f"mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_CLUSTER}/?retryWrites=true&w=majority&appName={MONGO_APP_NAME}"

# Connect to MongoDB
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

db = client[MONGO_DB_NAME]  # Database
collection = db["user-feedback"]  # Collection

def get_prediction(image):
    img_t = image_processor(images=image, return_tensors="pt")['pixel_values']
    pred = model(img_t)
    print(torch.softmax(pred.logits, dim=1))
    return torch.argmax(pred.logits.detach()).item()


def submit_feedback(image, image_label, model_prediction, user_feedback, platform):
    try:
        prediction = 0 if model_prediction == "The image is sensitive." else 1 # Added to fix need_for_train logic 
        user_prediction = 0 if user_feedback == "sensitive" else 1 # Added to fix need_for_train logic 
       

        # Check if model_prediction and user_feedback are opposite
        is_opposite = prediction != user_prediction

        # Prepare data for insertion
        feedback_data = {
            "_id": str(uuid.uuid4()),  # Unique ID for the feedback entry
            "image": Binary(image),  # Image file path or embeddings (you may modify)
            "image_label": image_label,  # Caption or label from user; can be used as Ground truth
            "model_prediction": model_prediction,  # Model's prediction
            "user_feedback": user_feedback,  # User's feedback
            "platform": platform,  # Platform (e.g., Instagram)
            "need_for_train": is_opposite,  # Boolean flag for retraining
            "timestamp": datetime.now()  # Current timestamp
        }

        # Insert data into MongoDB
        collection.insert_one(feedback_data)

        return {"message": "Feedback submitted successfully"}
    
    except Exception as e:
        return {"error": str(e)}
    
    
def check_and_finetune():
    """
    Checks MongoDB for new samples where 'need_for_train' is True.
    If found, runs the fine-tuning process and updates MongoDB entries.
    """
    print(f"[{datetime.now()}] Checking MongoDB for new samples...")

    # Fetch samples from MongoDB
    new_samples = list(collection.find({"need_for_train": True}))

    if not new_samples:
        print(f"[{datetime.now()}] No new samples found. Skipping fine-tuning.")
        return

    # Prepare data for fine-tuning
    processed_samples = [
        {"image": Image.open(io.BytesIO(bytes(doc["image"]))),
         "label": 1 if doc["user_feedback"] in [1, "sensitive"] else 0}
        for doc in new_samples
    ]

    # Extract document IDs for MongoDB update
    document_ids = [doc['_id'] for doc in new_samples]

    # Run fine-tuning
    print(f"[{datetime.now()}] Running fine-tuning...")
    short_finetune_and_compare(
        new_samples=processed_samples,
        base_dir=os.getenv('MODEL_DIR'),
        best_dir="./finetuned_Beit",
        num_epochs=2,
        batch_size=4,
        document_ids=document_ids
    )    
    
    print(f"[{datetime.now()}] Fine-tuning completed successfully.")

# -------------------------------------------------
# Step 2: Scheduler Configuration
# -------------------------------------------------
def start_scheduler():
    """
    Starts the APScheduler background scheduler to run every 24 hours.
    """
    check_and_finetune()
    # scheduler = BackgroundScheduler()
    # scheduler.add_job(check_and_finetune, 'interval', hours=1)
    # scheduler.start()
    print("[Scheduler Started] Checking MongoDB every 24 hours...")
