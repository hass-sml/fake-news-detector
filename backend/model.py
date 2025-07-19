# model.py

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import shap
# from lime.lime_text import LimeTextExplainer
# import numpy as np

# === Load the tokenizer & model ===
MODEL_NAME = "./models/bert-news-model" 

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

# === Make a prediction with temperature scaling AND return attentions ===
def predict(text: str, temperature: float = 1.5):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        # Important: request attentions!
        outputs = model(**inputs, output_attentions=True)

        logits = outputs.logits
        scaled_logits = logits / temperature  # temperature scaling
        probs = torch.nn.functional.softmax(scaled_logits, dim=1)

        prediction = torch.argmax(probs, dim=1).item()
        attentions = outputs.attentions  # <- this is a tuple of tensors

    return prediction, probs, attentions


# === SHAP explanation ===
def explain(text: str):
    def f(X):
        batch = tokenizer(list(X), padding=True, truncation=True, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**batch)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            return probs.detach().numpy()
    
    explainer = shap.Explainer(f, shap.maskers.Text(tokenizer))
    shap_values = explainer([text])
    
    
    # Return raw parts
    tokens = shap_values.data[0]
    scores = shap_values.values[0] 
    return {"tokens": tokens, "scores": scores}



# === LIME explanation ===

# def explain(text: str):
#     # 1️⃣ Classifier wrapper
#     def f(X):
#         batch = tokenizer(list(X), padding=True, truncation=True, return_tensors="pt")
#         with torch.no_grad():
#             logits = model(**batch).logits
#             probs = torch.nn.functional.softmax(logits, dim=1)
#             return probs.detach().cpu().numpy()
    
#     # 2️⃣ LIME explainer
#     explainer = LimeTextExplainer(class_names=["fake", "real"])
    
#     # 3️⃣ Explain
#     exp = explainer.explain_instance(
#         text_instance=text,
#         classifier_fn=f,
#         num_features=20,
#         labels=(0, 1)  # index for classes
#     )

#     # 4️⃣ Extract words & scores for predicted label
#     label = exp.available_labels()[0]  # pick first label (or match your prediction)
#     words_scores = exp.as_list(label=label)
#     tokens, scores = zip(*words_scores) if words_scores else ([], [])

#     return {
#     "tokens": list(tokens),
#     "scores": list(scores)
#     }

