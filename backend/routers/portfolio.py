"""
Portfolio Router - Contractor portfolio management
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime, timezone
from db import db
from models import PortfolioProject, PortfolioProjectCreate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/contractor/{contractor_id}")
async def get_contractor_portfolio(contractor_id: str, featured_only: bool = False):
    """Get portfolio projects for a contractor"""
    query = {"contractor_id": contractor_id, "status": "active"}
    if featured_only:
        query["featured"] = True
    
    projects = await db.portfolio_projects.find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return projects


@router.get("/project/{project_id}")
async def get_project(project_id: str):
    """Get a specific portfolio project"""
    project = await db.portfolio_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/project")
async def create_project(contractor_id: str, project: PortfolioProjectCreate):
    """Create a new portfolio project"""
    project_obj = PortfolioProject(
        contractor_id=contractor_id,
        **project.model_dump()
    )
    await db.portfolio_projects.insert_one(project_obj.model_dump())
    return project_obj.model_dump()


@router.put("/project/{project_id}")
async def update_project(project_id: str, contractor_id: str, updates: dict):
    """Update a portfolio project"""
    # Verify ownership
    project = await db.portfolio_projects.find_one(
        {"id": project_id, "contractor_id": contractor_id}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.portfolio_projects.update_one(
        {"id": project_id},
        {"$set": updates}
    )
    return {"status": "updated"}


@router.delete("/project/{project_id}")
async def delete_project(project_id: str, contractor_id: str):
    """Delete a portfolio project"""
    result = await db.portfolio_projects.update_one(
        {"id": project_id, "contractor_id": contractor_id},
        {"$set": {"status": "deleted"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}


@router.post("/project/{project_id}/feature")
async def toggle_featured(project_id: str, contractor_id: str):
    """Toggle featured status of a project"""
    project = await db.portfolio_projects.find_one(
        {"id": project_id, "contractor_id": contractor_id}, {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_featured = not project.get("featured", False)
    await db.portfolio_projects.update_one(
        {"id": project_id},
        {"$set": {"featured": new_featured}}
    )
    return {"featured": new_featured}


@router.get("/categories")
async def get_portfolio_categories():
    """Get available portfolio categories"""
    return [
        {"value": "plumbing", "label": "Plumbing"},
        {"value": "electrical", "label": "Electrical"},
        {"value": "painting", "label": "Painting"},
        {"value": "renovation", "label": "Renovation"},
        {"value": "landscaping", "label": "Landscaping"},
        {"value": "roofing", "label": "Roofing"},
        {"value": "flooring", "label": "Flooring"},
        {"value": "kitchen", "label": "Kitchen Remodel"},
        {"value": "bathroom", "label": "Bathroom Remodel"},
        {"value": "basement", "label": "Basement Finishing"},
        {"value": "deck", "label": "Deck/Patio"},
        {"value": "hvac", "label": "HVAC"},
        {"value": "other", "label": "Other"},
    ]
