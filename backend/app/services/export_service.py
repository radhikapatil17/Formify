import csv
import os
import tempfile

from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session

from app.repositories.form_version_repository import get_version_by_id
from app.repositories.export_repository import (
    get_submissions_by_form_version,
    get_response_values
)


def export_csv(
    version_id: int,
    db: Session,
    background_tasks: BackgroundTasks
):
    version = get_version_by_id(
        version_id,
        db
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    submissions = get_submissions_by_form_version(
        db,
        version_id
    )

    # Write to a secure temp file in /tmp — never the working directory
    tmp = tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".csv",
        delete=False,
        newline="",
        encoding="utf-8",
        dir=tempfile.gettempdir()
    )

    try:
        writer = csv.writer(tmp)
        writer.writerow([
            "Submission ID",
            "Field ID",
            "Response"
        ])

        for submission in submissions:
            responses = get_response_values(
                db,
                submission.id
            )

            for response in responses:
                writer.writerow([
                    submission.id,
                    response.field_id,
                    response.value_text
                ])
    finally:
        tmp.close()

    download_name = f"form_{version_id}_responses.csv"

    # Schedule temp file deletion after response is sent
    background_tasks.add_task(os.unlink, tmp.name)

    return FileResponse(
        path=tmp.name,
        filename=download_name,
        media_type="text/csv"
    )