import json
import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def extract_resume_data(resume_text: str) -> dict:
    """Use Claude API to extract structured data from resume text."""
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-api-key-here':
        logger.warning("Anthropic API key not configured. Returning minimal data.")
        return {'raw_text': resume_text, 'name': 'Unknown', 'skills': []}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-sonnet-4-5-20250514",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert resume parser. Extract structured data from this resume.
Return ONLY valid JSON with this exact structure:
{{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "summary": "1-2 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {{"company": "string", "title": "string", "duration": "string", "years": number, "highlights": ["string"]}}
  ],
  "education": [
    {{"institution": "string", "degree": "string", "year": number or null}}
  ],
  "certifications": ["string"],
  "total_experience_years": number
}}

Resume Text:
{resume_text}"""
                }
            ],
        )

        response_text = message.content[0].text

        # Parse JSON from response
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")

        return result

    except Exception as e:
        logger.error(f"Failed to extract resume data: {e}")
        # Return minimal data on failure
        return {
            'raw_text': resume_text,
            'name': 'Unknown',
            'skills': [],
            'experience': [],
            'education': [],
            'total_experience_years': 0,
        }
