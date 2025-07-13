# app.py

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from model import predict, explain
from utils.preprocess import clean_text

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] to allow all (less secure!)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class NewsRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict_news(news: NewsRequest):
    clean_news = clean_text(news.text.strip())


    prediction, probs, attentions = predict(clean_news)
    explanation = explain(clean_news)

    probs = probs.tolist()
    probability = probs[0]
    probability = probability[0] if prediction == 0 else probability[1]

    attentions_list = [a.squeeze().tolist() for a in attentions]
    
    tokens = explanation['tokens'].tolist()
    scores = explanation['scores'][:, 1].tolist()  # example for class 1
    # Pair and filter
    filtered = [(t, s) for t, s in zip(tokens, scores) if t.strip()]
    tokens, scores = zip(*filtered) if filtered else ([], [])

    print(scores)

    return {
    "prediction": "real" if prediction == 1 else "fake",
    "probability": probability,
    "tokens": list(tokens),
    "scores": list(scores),
    "attentions": attentions_list
}

if __name__ == "__main__":
    import uvicorn
    # Use a more stable configuration with a longer reload delay
    # and disable auto-reload if you're experiencing frequent crashes
    uvicorn.run(
        "app:app", 
        host="0.0.0.0",     
        port=8000,
        reload=True,
        reload_delay=2.0,  # Longer delay between reloads
        workers=1  # Single worker for development
    )



