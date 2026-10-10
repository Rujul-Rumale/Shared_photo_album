import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))

from app.core.database import SessionLocal
from app.models.base import Album, AllowedUser


def main():
    db = SessionLocal()
    try:
        albums = db.query(Album).all()
        members = db.query(AllowedUser).all()
        print(f"DATABASE VERIFICATION SUCCESSFUL")
        print(f"Albums in database ({len(albums)}):")
        for a in sorted(albums, key=lambda x: x.sort_order):
            print(f"  - [{a.sort_order}] {a.name} ({a.slug})")

        print(f"\nAllowed users in database ({len(members)}):")
        for s in members:
            print(f"  - {s.full_name} ({s.email}) -> Hash: {s.registration_code_hash[:12]}... (Used: {s.used})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
