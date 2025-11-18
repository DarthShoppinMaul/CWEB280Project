from pydantic import BaseModel, constr, ConfigDict, field_validator

class LocationBase(BaseModel):
    # Tests expect name >= 3 chars (they type "AB" and expect a validation error)
    name: constr(min_length=3, max_length=120)
    address: constr(min_length=3, max_length=200)
    # Phone is optional; stores ""
    phone: str | None = None

    # Trim required strings
    @field_validator("name", "address", mode="before")
    @classmethod
    def _strip_required(cls, v):
        return v.strip() if isinstance(v, str) else v

    # Normalize phone and validate when provided
    @field_validator("phone", mode="before")
    @classmethod
    def _normalize_phone(cls, v):
        if v is None:
            return ""                 # store empty string to fix tests
        return v.strip() if isinstance(v, str) else v

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v: str):
        # accept if empty (optional)
        if v == "":
            return v
        # allow many formats (spaces, (), dashes, +1, "ext.")
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) < 10:
            # This message matches the UI test’s expectation text
            raise ValueError("Please enter a valid phone number")
        return v

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    location_id: int
    model_config = ConfigDict(from_attributes=True)
