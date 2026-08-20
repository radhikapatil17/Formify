from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.publish_schema import PublishResponse
from app.services.publish_service import (
    publish_version,
    unpublish_version
)

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/publish",
    tags=["Publish"]
)


@router.post(
    "/{version_id}",
    response_model=PublishResponse
)
def publish(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    version = publish_version(version_id, db)

    from app.models.notification import Notification
    notif = Notification(
        user_id=current_user.id,
        title="Form Published Live",
        message=f"Form version v{version.version_number} has been published live to database.",
        type="published"
    )
    db.add(notif)
    db.commit()

    return PublishResponse(
        message="Form published successfully",
        public_link=version.public_link
    )


@router.post(
    "/unpublish/{version_id}",
    response_model=PublishResponse
)
def unpublish(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unpublish_version(version_id, db)

    return PublishResponse(
        message="Form unpublished successfully",
        public_link=None
    )