import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

SQLITE_DB = "hackathon.db"
# Use localhost if running outside docker, or 'db' if running inside. 
# Defaulting to localhost for a one-off migration script run from host.
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
PG_DB = os.getenv("POSTGRES_DB", "nexus_db")

def migrate():
    print(f"Connecting to SQLite: {SQLITE_DB}")
    lite_conn = sqlite3.connect(SQLITE_DB)
    lite_cur = lite_conn.cursor()

    print(f"Connecting to Postgres: {PG_HOST}:{PG_PORT}/{PG_DB}")
    try:
        pg_conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASS,
            dbname=PG_DB
        )
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")
        return

    # 1. Migrate Users
    print("Migrating [users]...")
    lite_cur.execute("SELECT id, encrypted_email, encrypted_full_name, hashed_password, role, mfa_enabled, mfa_secret, is_active FROM users")
    users = lite_cur.fetchall()
    
    for user in users:
        pg_cur.execute(
            """INSERT INTO users (id, encrypted_email, encrypted_full_name, hashed_password, role, mfa_enabled, mfa_secret, is_active) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            user
        )
    
    # 2. Migrate Fleet Logs
    print("Migrating [fleet_logs]...")
    lite_cur.execute("SELECT id, shipment_id, agent_name, status, logs, timestamp FROM fleet_logs")
    logs = lite_cur.fetchall()
    
    for log in logs:
        pg_cur.execute(
            """INSERT INTO fleet_logs (id, shipment_id, agent_name, status, logs, timestamp) 
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            log
        )

    pg_conn.commit()
    print("Migration completed successfully!")
    
    pg_cur.close()
    pg_conn.close()
    lite_conn.close()

if __name__ == "__main__":
    migrate()
