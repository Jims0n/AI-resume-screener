import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def extract_skills_from_description(description: str) -> dict:
    """Use Anthropic Claude to extract skills from a job description."""
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-api-key-here':
        logger.warning("Anthropic API key not configured. Skipping skill extraction.")
        return {'required_skills': [], 'nice_to_have_skills': [], 'min_experience_years': 0}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-sonnet-4-5-20250514",
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
        # Try to extract JSON from the response
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")

        return {
            'required_skills': result.get('required_skills', []),
            'nice_to_have_skills': result.get('nice_to_have_skills', []),
            'min_experience_years': result.get('min_experience_years', 0),
        }
    except Exception as e:
        logger.error(f"Failed to extract skills: {e}")
        return {'required_skills': [], 'nice_to_have_skills': [], 'min_experience_years': 0}
