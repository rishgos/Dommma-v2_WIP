"""
Database Seeding Script for DOMMMA
Run: python seed_database.py

This script populates your local MongoDB with sample data:
- Rental listings
- Sale listings  
- Contractor profiles
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import random
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "dommma")

# Sample data
VANCOUVER_NEIGHBORHOODS = [
    "Downtown", "Yaletown", "Kitsilano", "Mount Pleasant", "Gastown",
    "West End", "Coal Harbour", "Fairview", "Kerrisdale", "UBC",
    "Commercial Drive", "Main Street", "South Granville", "Dunbar", "Point Grey"
]

PROPERTY_IMAGES = [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
]

PROPERTY_TYPES = ["Apartment", "Condo", "House", "Townhouse", "Loft", "Studio", "Penthouse"]
AMENITIES = ["Gym", "Pool", "Parking", "Balcony", "In-suite Laundry", "Dishwasher", 
             "Air Conditioning", "Rooftop", "Concierge", "Pet-friendly", "Storage", "Bike Room"]

CONTRACTOR_SPECIALTIES = [
    ["Plumbing", "Pipe Repair", "Water Heater"],
    ["Electrical", "Wiring", "Lighting"],
    ["Painting", "Interior Design", "Wallpaper"],
    ["Renovation", "Kitchen Remodel", "Bathroom Remodel"],
    ["Carpentry", "Custom Furniture", "Deck Building"],
    ["Landscaping", "Garden Design", "Lawn Care"],
    ["Cleaning", "Deep Cleaning", "Move-out Cleaning"],
    ["HVAC", "Heating", "Air Conditioning"],
    ["Roofing", "Gutter Repair", "Insulation"],
    ["General Handyman", "Repairs", "Assembly"]
]

CONTRACTOR_NAMES = [
    ("Mike's Plumbing Pro", "Mike Johnson"),
    ("Spark Electric Services", "Sarah Chen"),
    ("Perfect Paint Co", "David Kim"),
    ("Vancouver Renovations", "Lisa Wang"),
    ("Craftsman Carpentry", "James Wilson"),
    ("Green Thumb Landscaping", "Maria Garcia"),
    ("Sparkle Clean Services", "Emily Brown"),
    ("Cool Air HVAC", "Robert Lee"),
    ("Top Roof Solutions", "Chris Taylor"),
    ("Handy Helper Services", "Alex Martinez")
]


def generate_rental_listing(neighborhood):
    """Generate a rental listing"""
    property_type = random.choice(PROPERTY_TYPES)
    bedrooms = random.randint(0, 4) if property_type != "Studio" else 0
    bathrooms = max(1, bedrooms) if bedrooms > 0 else 1
    sqft = random.randint(400, 2500)
    
    # Price based on bedrooms and neighborhood
    base_price = 1500 + (bedrooms * 500) + random.randint(-200, 500)
    if neighborhood in ["Downtown", "Yaletown", "Coal Harbour"]:
        base_price += 500
    
    return {
        "id": str(uuid.uuid4()),
        "title": f"{property_type} in {neighborhood}",
        "description": f"Beautiful {bedrooms} bedroom {property_type.lower()} in the heart of {neighborhood}. "
                      f"Features modern finishes, plenty of natural light, and great amenities. "
                      f"Walking distance to shops, restaurants, and transit.",
        "price": base_price,
        "address": f"{random.randint(100, 9999)} {random.choice(['West', 'East'])} {random.randint(1, 70)}th Ave",
        "city": "Vancouver",
        "province": "BC",
        "postal_code": f"V{random.randint(1,6)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')} {random.randint(1,9)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1,9)}",
        "property_type": property_type,
        "listing_type": "rent",
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "sqft": sqft,
        "amenities": random.sample(AMENITIES, random.randint(3, 8)),
        "images": random.sample(PROPERTY_IMAGES, random.randint(2, 5)),
        "pet_friendly": random.choice([True, False]),
        "parking_included": random.choice([True, False]),
        "available_date": datetime.now(timezone.utc).isoformat(),
        "landlord_id": str(uuid.uuid4()),
        "status": "active",
        "featured": random.choice([True, False, False, False]),  # 25% chance featured
        "views": random.randint(10, 500),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 49.2827 + random.uniform(-0.1, 0.1),
        "longitude": -123.1207 + random.uniform(-0.1, 0.1)
    }


def generate_sale_listing(neighborhood):
    """Generate a sale listing"""
    property_type = random.choice(["Condo", "House", "Townhouse", "Penthouse"])
    bedrooms = random.randint(1, 5)
    bathrooms = max(1, bedrooms - 1) + random.randint(0, 2)
    sqft = random.randint(600, 4000)
    
    # Price based on sqft, bedrooms, and neighborhood (Vancouver prices!)
    base_price = (sqft * random.randint(800, 1200)) + (bedrooms * 50000)
    if neighborhood in ["Downtown", "Yaletown", "Coal Harbour", "West End"]:
        base_price = int(base_price * 1.3)
    if property_type == "House":
        base_price = int(base_price * 1.5)
    
    return {
        "id": str(uuid.uuid4()),
        "title": f"{bedrooms}BR {property_type} - {neighborhood}",
        "description": f"Stunning {bedrooms} bedroom {property_type.lower()} in prestigious {neighborhood}. "
                      f"This {sqft} sq ft home features high-end finishes, modern kitchen, "
                      f"and spectacular views. Perfect for families or investors.",
        "price": base_price,
        "address": f"{random.randint(100, 9999)} {random.choice(['West', 'East'])} {random.randint(1, 70)}th Ave",
        "city": "Vancouver",
        "province": "BC",
        "postal_code": f"V{random.randint(1,6)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')} {random.randint(1,9)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1,9)}",
        "property_type": property_type,
        "listing_type": "sale",
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "sqft": sqft,
        "amenities": random.sample(AMENITIES, random.randint(4, 10)),
        "images": random.sample(PROPERTY_IMAGES, random.randint(3, 6)),
        "year_built": random.randint(1980, 2024),
        "lot_size": random.randint(2000, 8000) if property_type == "House" else None,
        "seller_id": str(uuid.uuid4()),
        "status": "active",
        "featured": random.choice([True, False, False, False]),
        "views": random.randint(50, 1000),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "latitude": 49.2827 + random.uniform(-0.1, 0.1),
        "longitude": -123.1207 + random.uniform(-0.1, 0.1)
    }


def generate_contractor(index):
    """Generate a contractor profile"""
    company_name, owner_name = CONTRACTOR_NAMES[index % len(CONTRACTOR_NAMES)]
    specialties = CONTRACTOR_SPECIALTIES[index % len(CONTRACTOR_SPECIALTIES)]
    
    # Create email from company name
    email_name = company_name.lower().replace(' ', '').replace("'", '')
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "company_name": company_name,
        "owner_name": owner_name,
        "email": f"{email_name}@example.com",
        "phone": f"604-{random.randint(100,999)}-{random.randint(1000,9999)}",
        "specialties": specialties,
        "description": f"{company_name} provides professional {specialties[0].lower()} services in Vancouver. "
                      f"With over {random.randint(5, 20)} years of experience, we guarantee quality work and customer satisfaction.",
        "hourly_rate": random.randint(50, 150),
        "rating": round(random.uniform(4.0, 5.0), 1),
        "review_count": random.randint(10, 200),
        "completed_jobs": random.randint(50, 500),
        "verified": True,
        "insured": True,
        "licensed": True,
        "service_areas": random.sample(VANCOUVER_NEIGHBORHOODS, random.randint(3, 8)),
        "availability": {
            "monday": True,
            "tuesday": True,
            "wednesday": True,
            "thursday": True,
            "friday": True,
            "saturday": random.choice([True, False]),
            "sunday": False
        },
        "profile_image": f"https://randomuser.me/api/portraits/{'men' if index % 2 == 0 else 'women'}/{index + 1}.jpg",
        "portfolio_images": random.sample(PROPERTY_IMAGES, 3),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


async def seed_database():
    """Main seeding function"""
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Ask user what to seed
    print("\n=== DOMMMA Database Seeder ===")
    print("1. Seed rental listings only")
    print("2. Seed sale listings only")
    print("3. Seed contractors only")
    print("4. Seed everything (rentals + sales + contractors)")
    print("5. Clear all data and seed fresh")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == "5":
        print("\nClearing existing data...")
        await db.listings.delete_many({})
        await db.contractor_profiles.delete_many({})
        print("Data cleared!")
    
    # Seed rentals
    if choice in ["1", "4", "5"]:
        num_rentals = int(input("How many rental listings? (default 20): ").strip() or "20")
        print(f"\nCreating {num_rentals} rental listings...")
        rentals = [generate_rental_listing(random.choice(VANCOUVER_NEIGHBORHOODS)) for _ in range(num_rentals)]
        if rentals:
            await db.listings.insert_many(rentals)
            print(f"✅ Created {len(rentals)} rental listings")
    
    # Seed sales
    if choice in ["2", "4", "5"]:
        num_sales = int(input("How many sale listings? (default 15): ").strip() or "15")
        print(f"\nCreating {num_sales} sale listings...")
        sales = [generate_sale_listing(random.choice(VANCOUVER_NEIGHBORHOODS)) for _ in range(num_sales)]
        if sales:
            await db.listings.insert_many(sales)
            print(f"✅ Created {len(sales)} sale listings")
    
    # Seed contractors
    if choice in ["3", "4", "5"]:
        num_contractors = int(input("How many contractors? (default 10): ").strip() or "10")
        print(f"\nCreating {num_contractors} contractor profiles...")
        contractors = [generate_contractor(i) for i in range(num_contractors)]
        if contractors:
            await db.contractor_profiles.insert_many(contractors)
            print(f"✅ Created {len(contractors)} contractor profiles")
    
    # Show summary
    total_rentals = await db.listings.count_documents({"listing_type": "rent"})
    total_sales = await db.listings.count_documents({"listing_type": "sale"})
    total_contractors = await db.contractor_profiles.count_documents({})
    
    print("\n=== Database Summary ===")
    print(f"📍 Rental Listings: {total_rentals}")
    print(f"🏠 Sale Listings: {total_sales}")
    print(f"🔧 Contractors: {total_contractors}")
    print("\nDone! Restart your backend to see the changes.")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
