from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os
from contextlib import asynccontextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./hackathon.db")

class DatabaseSessionManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseSessionManager, cls).__new__(cls)
            cls._instance._engine = create_async_engine(DATABASE_URL, echo=False)
            cls._instance._sessionmaker = async_sessionmaker(
                cls._instance._engine, 
                expire_on_commit=False, 
                class_=AsyncSession
            )
        return cls._instance

    @property
    def engine(self):
        return self._engine

    @property
    def session_maker(self):
        return self._sessionmaker

    @asynccontextmanager
    async def session(self):
        if self._sessionmaker is None:
            raise Exception("DatabaseSessionManager is not initialized")
        async with self._sessionmaker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def close(self):
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._sessionmaker = None

db_manager = DatabaseSessionManager()
Base = declarative_base()

async def get_db():
    async with db_manager.session() as session:
        yield session

async def init_db():
    async with db_manager.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
