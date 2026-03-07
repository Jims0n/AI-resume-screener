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

    # Use custom weights from the job, falling back to defaults
    skill_w = getattr(job, 'skill_weight', 0.5) or 0.5
    exp_w = getattr(job, 'experience_weight', 0.3) or 0.3
    edu_w = getattr(job, 'education_weight', 0.2) or 0.2

    # Build custom criteria section
    custom_criteria_text = ''
    custom_criteria = getattr(job, 'custom_criteria', []) or []
    if custom_criteria:
        criteria_lines = []
        for c in custom_criteria:
            name = c.get('name', '')
            weight = c.get('weight', 0)
            desc = c.get('description', '')
            criteria_lines.append(f"  - {name} (weight: {weight}): {desc}")
        custom_criteria_text = '\nAdditional Custom Criteria:\n' + '\n'.join(criteria_lines)

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=60.0)

        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert recruiter scoring a candidate against a job.

Scoring weights: {int(skill_w*100)}% skills, {int(exp_w*100)}% experience, {int(edu_w*100)}% education.
Required skills are weighted 2x vs nice-to-have skills.
{custom_criteria_text}

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
