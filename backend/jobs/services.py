import logging
import anthropic
from django.conf import settings
from candidates.services.utils import parse_json_response

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def extract_skills_from_description(description: str) -> dict:
    """Use Anthropic Claude to extract skills from a job description."""
    default = {'required_skills': [], 'nice_to_have_skills': [], 'min_experience_years': 0}

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-api-key-here':
        info_logger.warning("Anthropic API key not configured. Skipping skill extraction.")
        return default

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=60.0)

        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert recruiter. Extract skills from this job description.
Return ONLY valid JSON:
{{
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "min_experience_years": number
}}

Job Description:
{description}"""
                }
            ],
        )

        response_text = message.content[0].text
        result = parse_json_response(response_text)

        extracted = {
            'required_skills': result.get('required_skills', []),
            'nice_to_have_skills': result.get('nice_to_have_skills', []),
            'min_experience_years': result.get('min_experience_years', 0),
        }
        info_logger.info(
            f"Skills extracted: {len(extracted['required_skills'])} required, "
            f"{len(extracted['nice_to_have_skills'])} nice-to-have, "
            f"min_exp={extracted['min_experience_years']}y"
        )
        return extracted
    except Exception as e:
        error_logger.error(f"Failed to extract skills: {e}", exc_info=True)
        return default
