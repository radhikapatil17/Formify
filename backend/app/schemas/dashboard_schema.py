from pydantic import BaseModel
from typing import List, Optional

class ChartDataItem(BaseModel):
    name: str
    value: int

class RecentSubmissionItem(BaseModel):
    id: str
    form: str
    respondent: str
    fields: str
    timeTaken: str
    submittedAt: str
    status: str

class RecentActivityItem(BaseModel):
    title: str
    details: str
    status: str
    statusColor: str

class DashboardSummary(BaseModel):
    total_forms: int
    published_forms: int
    draft_forms: int
    archived_forms: int
    total_submissions: int
    responses_today: int
    avg_completion_rate: str
    active_users: int
    total_response_values: int
    chart_data: List[ChartDataItem] = []
    recent_submissions: List[RecentSubmissionItem] = []
    recent_activity: List[RecentActivityItem] = []