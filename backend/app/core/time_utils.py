from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Asia/Kolkata is Indian Standard Time (IST), fixed offset UTC+5:30
IST_OFFSET = timedelta(hours=5, minutes=30)
IST_TZ = timezone(IST_OFFSET, name="Asia/Kolkata")

def get_current_date_time(tz_name: str = "Asia/Kolkata") -> Dict[str, Any]:
    """
    Returns the dynamic current server date, time, and timezone.
    Never hardcoded. Defaults to Asia/Kolkata (IST).
    Resilient on all OS platforms (Windows, Linux, macOS).
    """
    tz = IST_TZ
    if tz_name != "Asia/Kolkata":
        try:
            import zoneinfo
            tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            tz = IST_TZ
            tz_name = "Asia/Kolkata"

    now = datetime.now(tz)
    return {
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "timezone": tz_name,
        "formatted_date": now.strftime("%d %B %Y"),
        "year": now.year,
        "month": now.strftime("%B"),
        "day": now.day,
        "iso": now.isoformat()
    }

# Alias matching user requirement
def getCurrentDateTime() -> Dict[str, Any]:
    return get_current_date_time()
