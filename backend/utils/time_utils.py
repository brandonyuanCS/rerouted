"""
Time utilities for parsing and calculating durations.
"""

from datetime import datetime, timedelta


def parse_time(time_str: str) -> datetime:
    """Parse HH:MM:SS to datetime (today's date)."""
    parts = time_str.split(":")
    hour = int(parts[0])
    minute = int(parts[1])
    second = int(parts[2]) if len(parts) > 2 else 0
    
    today = datetime.now().replace(hour=hour, minute=minute, second=second, microsecond=0)
    return today


def parse_datetime(dt_str: str) -> datetime:
    """Parse ISO datetime string."""
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


def time_to_minutes(time_str: str) -> int:
    """Convert HH:MM:SS to minutes since midnight."""
    parts = time_str.split(":")
    hours = int(parts[0])
    minutes = int(parts[1])
    return hours * 60 + minutes


def minutes_to_time(minutes: int) -> str:
    """Convert minutes since midnight to HH:MM:SS."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}:00"


def hours_between(start: str, end: str) -> float:
    """Calculate hours between two ISO datetime strings."""
    start_dt = parse_datetime(start)
    end_dt = parse_datetime(end)
    delta = end_dt - start_dt
    return delta.total_seconds() / 3600


def get_simulation_time() -> datetime:
    """Get the simulation time (from disruptions data)."""
    # Default simulation time from the data
    return datetime(2026, 1, 24, 5, 0, 0)
