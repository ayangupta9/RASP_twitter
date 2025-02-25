import glob
import os
from transformers import AutoImageProcessor, BeitForImageClassification
import torch
import torch.nn as nn
import albumentations as A
import matplotlib.pyplot as plt
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import uuid
from bson.binary import Binary
from datetime import datetime
from dotenv import load_dotenv

model_folder = "./BEiT_XAI"
image_processor = AutoImageProcessor.from_pretrained(model_folder)
model = BeitForImageClassification.from_pretrained(model_folder)

resize_fn = A.Resize(height=224, width=224, always_apply=True)


# Load environment variables from .env file
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
    img_t = torch.from_numpy(resize_fn(image=image)['image']).permute(2,0,1).unsqueeze(0).float()
    pred = model(img_t)
    print(torch.softmax(pred.logits, dim=1))
    return torch.argmax(pred.logits.detach()).item()


def submit_feedback(image, image_label, model_prediction, user_feedback, platform):
    try:
        # Check if model_prediction and user_feedback are opposite
        is_opposite = model_prediction != user_feedback

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