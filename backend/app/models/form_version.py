from sqlalchemy import Column,Integer,String,Boolean,ForeignKey,DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class FormVersion(Base):

    __tablename__="form_versions"

    id=Column(Integer,primary_key=True,index=True)

    form_id=Column(Integer,ForeignKey("forms.id"))

    version_number=Column(Integer)

    is_published=Column(Boolean,default=False)

    published_at=Column(DateTime(timezone=True))

    public_link=Column(String)