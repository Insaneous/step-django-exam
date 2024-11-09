from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from user.router import router as router_user
from chat.router import router as router_chat
from ws.router import router as router_ws

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount('/media', StaticFiles(directory='media'), name='media')
app.include_router(router_user)
app.include_router(router_chat)
app.include_router(router_ws)

@app.get("/")
async def root():
    return {"message": "There is no spoon."}