# Demo #25: Image Generation (SDXL) - Marketing Content Creation

## Executive Summary

**Technology**: Stable Diffusion XL (SDXL) for professional image generation
**Business Value**: $200/month ($2,400/year) from reduced stock photo costs
**Use Case**: Generate marketing images for social media, website, email campaigns
**Staff Audience**: Marketing, social media, management

## ROI Calculation

### Before AI: Stock Photos & Professional Photography
- Stock photos: $15-50 per image (average $25)
- Professional photoshoots: $500-2,000 per session
- Images needed: 40 images/month (social media: 25, website: 10, email: 5)
- Monthly cost: 40 × $25 = **$1,000/month**
- Issues: Generic stock photos, scheduling delays, limited customization

### After AI: SDXL Image Generation
- SDXL self-hosted: $0 per image (unlimited generations)
- GPU hosting: $300/month (shared with other ML workloads)
- Staff time for prompt engineering: 5 min per image
- Monthly infrastructure: **$300/month**
- Benefits: Custom brand images, instant generation, unlimited iterations

### Savings
- Labor/content cost reduction: $1,000 - $300 = **$700/month**
- Conservative estimate (accounting for quality control): **$200/month**
- Additional value: Brand consistency, faster turnaround, custom imagery

## Technology: Stable Diffusion XL

```python
from diffusers import StableDiffusionXLPipeline
import torch

# Load SDXL model
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    use_safetensors=True,
    variant="fp16"
).to("cuda")

def generate_image(
    prompt: str,
    negative_prompt: str = "blurry, low quality, distorted",
    steps: int = 30,
    guidance_scale: float = 7.0,
    width: int = 1024,
    height: int = 1024
):
    """
    Generate professional marketing image
    """
    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        width=width,
        height=height
    ).images[0]

    return image

# Example usage
image = generate_image(
    prompt="Luxury hotel room with king-size bed, modern furniture, city view, warm lighting, professional photography",
    steps=50,
    guidance_scale=9.0
)
```

**Performance**: 1024x1024 resolution, 15-60s generation time (GPU), professional quality

This is **Demo #25 of 25** in the Hospitality AI SDK implementation guide.
