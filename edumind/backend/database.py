from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_default_database()
    # Create indexes for performance
    await db.users.create_index("email", unique=True)
    await db.notes.create_index("user_id")
    await db.quiz_scores.create_index("user_id")
    await db.flashcards.create_index("user_id")
    await db.reminders.create_index("user_id")
    await db.activity.create_index("user_id")
    print("✅ MongoDB connected")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
