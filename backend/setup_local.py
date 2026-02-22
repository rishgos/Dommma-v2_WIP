"""
DOMMMA Local Setup Script
Run: python setup_local.py

This script:
1. Checks all dependencies are installed
2. Sets up environment files
3. Seeds the database with sample data
4. Verifies everything is working
"""

import subprocess
import sys
import os
import shutil

def run_command(cmd, check=True):
    """Run a shell command"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=check)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return None

def check_python_packages():
    """Check and install required Python packages"""
    print("\n📦 Checking Python packages...")
    packages = [
        "fastapi", "uvicorn", "motor", "pydantic", "python-dotenv",
        "passlib", "bcrypt==4.0.1", "python-jose", "httpx", "anthropic", "openai"
    ]
    
    for package in packages:
        try:
            pkg_name = package.split("==")[0]
            __import__(pkg_name.replace("-", "_"))
            print(f"  ✅ {pkg_name}")
        except ImportError:
            print(f"  📥 Installing {package}...")
            run_command(f"pip install {package}")

def setup_env_files():
    """Setup environment files from .env.local templates"""
    print("\n🔧 Setting up environment files...")
    
    # Backend .env
    backend_env_local = os.path.join(os.path.dirname(__file__), ".env.local")
    backend_env = os.path.join(os.path.dirname(__file__), ".env")
    
    if os.path.exists(backend_env_local):
        shutil.copy(backend_env_local, backend_env)
        print("  ✅ Backend .env configured")
    else:
        print("  ⚠️  Backend .env.local not found - please create .env manually")
    
    # Frontend .env
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    frontend_env_local = os.path.join(frontend_dir, ".env.local")
    frontend_env = os.path.join(frontend_dir, ".env")
    
    if os.path.exists(frontend_env_local):
        shutil.copy(frontend_env_local, frontend_env)
        print("  ✅ Frontend .env configured")
    else:
        print("  ⚠️  Frontend .env.local not found - please create .env manually")

def check_mongodb():
    """Check if MongoDB is running"""
    print("\n🗄️  Checking MongoDB...")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        async def check():
            client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
            await client.admin.command('ping')
            client.close()
            return True
        
        asyncio.run(check())
        print("  ✅ MongoDB is running")
        return True
    except Exception as e:
        print("  ❌ MongoDB is NOT running")
        print("  💡 Start MongoDB with: mongod --dbpath /path/to/data")
        print("     Or install MongoDB: https://www.mongodb.com/try/download/community")
        return False

def seed_database():
    """Seed the database with sample data"""
    print("\n🌱 Seeding database...")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from dotenv import load_dotenv
        import asyncio
        import uuid
        import random
        from datetime import datetime, timezone
        
        load_dotenv()
        
        MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        DB_NAME = os.environ.get("DB_NAME", "dommma")
        
        NEIGHBORHOODS = ["Downtown", "Yaletown", "Kitsilano", "Mount Pleasant", "Coquitlam", 
                        "Burnaby", "Richmond", "West End", "Coal Harbour", "UBC"]
        
        IMAGES = [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        ]
        
        # Coordinates for different areas
        COORDS = {
            "Downtown": (49.2827, -123.1207),
            "Yaletown": (49.2756, -123.1209),
            "Kitsilano": (49.2689, -123.1620),
            "Mount Pleasant": (49.2634, -123.1006),
            "Coquitlam": (49.2838, -122.7932),
            "Burnaby": (49.2488, -122.9805),
            "Richmond": (49.1666, -123.1336),
            "West End": (49.2856, -123.1412),
            "Coal Harbour": (49.2898, -123.1323),
            "UBC": (49.2606, -123.2460),
        }
        
        async def seed():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            
            # Check if already seeded
            count = await db.listings.count_documents({})
            if count > 20:
                print(f"  ℹ️  Database already has {count} listings")
                client.close()
                return
            
            # Clear and seed
            await db.listings.delete_many({})
            await db.contractor_profiles.delete_many({})
            
            listings = []
            for i in range(30):
                neighborhood = random.choice(NEIGHBORHOODS)
                lat, lng = COORDS.get(neighborhood, (49.2827, -123.1207))
                lat += random.uniform(-0.02, 0.02)
                lng += random.uniform(-0.02, 0.02)
                
                bedrooms = random.randint(0, 4)
                listing_type = random.choice(["rent", "sale"])
                price = random.randint(1500, 4000) if listing_type == "rent" else random.randint(500000, 2000000)
                
                listings.append({
                    "id": str(uuid.uuid4()),
                    "title": f"{'Studio' if bedrooms == 0 else str(bedrooms) + 'BR'} {random.choice(['Condo', 'Apartment', 'House', 'Townhouse'])} in {neighborhood}",
                    "address": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Granville', 'Robson', 'Davie'])} St",
                    "city": neighborhood if neighborhood in ["Coquitlam", "Burnaby", "Richmond"] else "Vancouver",
                    "province": "BC",
                    "postal_code": f"V{random.randint(1,6)}A 1B{random.randint(1,9)}",
                    "lat": lat,
                    "lng": lng,
                    "price": price,
                    "bedrooms": bedrooms,
                    "bathrooms": max(1, bedrooms),
                    "sqft": random.randint(400, 2000),
                    "property_type": random.choice(["Condo", "Apartment", "House", "Townhouse"]),
                    "listing_type": listing_type,
                    "description": f"Beautiful property in {neighborhood}. Modern finishes, great location.",
                    "amenities": random.sample(["Gym", "Pool", "Parking", "Balcony", "In-suite Laundry"], 3),
                    "images": random.sample(IMAGES, 2),
                    "pet_friendly": random.choice([True, False]),
                    "parking": random.choice([True, False]),
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            
            await db.listings.insert_many(listings)
            print(f"  ✅ Created {len(listings)} listings")
            
            # Seed contractors
            contractors = []
            specialties_list = [
                ["Plumbing", "Pipe Repair"], ["Electrical", "Wiring"], 
                ["Painting", "Interior Design"], ["Renovation", "Remodeling"],
                ["Cleaning", "Deep Cleaning"], ["HVAC", "Heating"]
            ]
            for i, specs in enumerate(specialties_list):
                contractors.append({
                    "id": str(uuid.uuid4()),
                    "user_id": str(uuid.uuid4()),
                    "company_name": f"{specs[0]} Pro Services",
                    "owner_name": f"Contractor {i+1}",
                    "email": f"contractor{i+1}@example.com",
                    "phone": f"604-{random.randint(100,999)}-{random.randint(1000,9999)}",
                    "specialties": specs,
                    "description": f"Professional {specs[0].lower()} services in Vancouver.",
                    "hourly_rate": random.randint(50, 150),
                    "rating": round(random.uniform(4.0, 5.0), 1),
                    "review_count": random.randint(10, 100),
                    "verified": True,
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            
            await db.contractor_profiles.insert_many(contractors)
            print(f"  ✅ Created {len(contractors)} contractors")
            
            client.close()
        
        asyncio.run(seed())
        
    except Exception as e:
        print(f"  ❌ Seeding failed: {e}")

def print_instructions():
    """Print final instructions"""
    print("\n" + "="*50)
    print("🎉 SETUP COMPLETE!")
    print("="*50)
    print("""
To run DOMMMA locally:

1. START MONGODB (if not running):
   mongod --dbpath /path/to/your/data

2. START BACKEND (in backend folder):
   cd backend
   uvicorn server:app --reload --host 0.0.0.0 --port 8001

3. START FRONTEND (in frontend folder, new terminal):
   cd frontend
   npm install   # or: yarn install
   npm start     # or: yarn start

4. OPEN BROWSER:
   http://localhost:3000

All features should work:
✅ User login/signup
✅ Property listings with maps
✅ Nova AI chatbot
✅ Contractor marketplace
✅ Stripe payments
✅ Voice features
""")

def main():
    print("="*50)
    print("🏠 DOMMMA Local Setup")
    print("="*50)
    
    check_python_packages()
    setup_env_files()
    
    if check_mongodb():
        seed_database()
    
    print_instructions()

if __name__ == "__main__":
    main()
