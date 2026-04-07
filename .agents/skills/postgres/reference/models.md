# SQLAlchemy Model Patterns

## Base & TimestampMixin

```python
# backend/app/models/base.py
from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from sqlalchemy import func

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
```

## Job model with pgvector

```python
# backend/app/models/job.py
import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.models.base import Base, TimestampMixin

class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str | None] = mapped_column(String(2048))
    description: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    applications: Mapped[list["Application"]] = relationship(back_populates="job")
```

## Pydantic schema conventions (separate Create/Update/Response)

```python
# backend/app/schemas/job.py
from pydantic import BaseModel, ConfigDict
import uuid

class JobCreate(BaseModel):
    title: str
    company: str
    url: str | None = None
    description: str | None = None

class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    company: str
    created_at: datetime
```
