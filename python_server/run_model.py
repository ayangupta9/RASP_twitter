import glob
import os
from transformers import AutoImageProcessor, BeitForImageClassification
import torch
import torch.nn as nn
import albumentations as A
import matplotlib.pyplot as plt


model_folder = "./python_server/BEiT_XAI"
image_processor = AutoImageProcessor.from_pretrained(model_folder)
model = BeitForImageClassification.from_pretrained(model_folder)

resize_fn = A.Resize(height=512, width=512, always_apply=True)

def get_prediction(image):
    img_t = torch.from_numpy(resize_fn(image=image)['image']).permute(2,0,1).unsqueeze(0).float()
    pred = model(img_t)
    print(torch.softmax(pred.logits, dim=1))
    return torch.argmax(pred.logits.detach()).item()