# config.py
from supabase import create_client

SUPABASE_URL = "https://bekapgqkbucjukigthvl.supabase.co"
SUPABASE_KEY = "sb_publishable_boGbYRPaDWRO8xunSZlSCQ_pvkRbfvG"
API_URL      = "http://localhost:3000"
ROBOT_ID     = "a1b2c3d4-e5f6-7890-abcd-ef1234567895"
LOCAL_FILE   = "schedules.json"
PENDING_FILE = "pending_logs.json"

DIES_CAT = ["dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)