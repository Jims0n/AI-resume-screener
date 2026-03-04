import json
import logging
import anthropic
from django.conf import settings
from .utils import parse_json_response

logger = logging.getLogger(__name__)


def score_candidate(parsed_data: dict, job) -> dict:
    """Use Claude API to score a candidate against job requirements."""
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-api-key-here':
        logger.warning("Anthropic API key not configured. Returning default scores.")
        return _default_scores(job)

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=60.0)

        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert recruiter scoring a candidate against a job.

Scoring weights: 50% skills, 30% experience, 20% education.
Required skills are weighted 2x vs nice-to-have skills.

Return ONLY valid JSON:
{{
  "overall_score": 0-100,
  "skill_match_score": 0-100,
  "experience_score": 0-100,
  "education_score": 0-100,
  "reasoning": "2-3 sentence summary explaining the scores",
  "skill_matches": [
    {{"skill_name": "string", "found": boolean, "proficiency": "none|beginner|intermediate|advanced|expert", "evidence": "brief evidence from resume", "is_required": boolean}}
  ],
  "strengths": ["string"],
  "red_flags": ["string"]
}}

Job Requirements:
- Title: {job.title}
- Required Skills: {json.dumps(job.required_skills)}
- Nice-to-Have Skills: {json.dumps(job.nice_to_have_skills)}
- Minimum Experience: {job.min_experience_years} years

Candidate Data:
{json.dumps(parsed_data, indent=2)}"""
                }
            ],
        )

        response_text = message.content[0].text
        return parse_json_response(response_text)

    except Exception as e:
        logger.error(f"Failed to score candidate: {e}")
        return _default_scores(job)


def _default_scores(job) -> dict:
    """Return default scores when AI scoring fails."""
    skill_matches = []
    for skill in job.required_skills:
        skill_matches.append({
            'skill_name': skill,
            'found': False,
            'proficiency': 'none',
            'evidence': '',
            'is_required': True,
        })
    for skill in job.nice_to_have_skills:
        skill_matches.append({
            'skill_name': skill,
            'found': False,
            'proficiency': 'none',
            'evidence': '',
            'is_required': False,
        })

    return {
        'overall_score': 0,
        'skill_match_score': 0,
        'experience_score': 0,
        'education_score': 0,
        'reasoning': 'AI scoring unavailable. Please configure the API key and reprocess.',
        'skill_matches': skill_matches,
        'strengths': [],
        'red_flags': ['AI scoring was not available'],
    }
