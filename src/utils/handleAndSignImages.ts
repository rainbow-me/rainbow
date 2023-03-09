import isSVGImage from '@/utils/isSVG';
import { getFullSizeUrl } from '@/utils/getFullSizeUrl';
import { maybeSignUri } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { getLowResUrl } from '@/utils/getLowResUrl';

export function handleAndSignImages(
  imageUrl?: string,
  previewUrl?: string,
  originalUrl?: string
): {
  imageUrl?: string;
  lowResUrl?: string;
} {
  const image = imageUrl || originalUrl || previewUrl;

  if (!image) {
    return {};
  }

  const isSVG = isSVGImage(image);
  const fullImage = isSVG ? image : getFullSizeUrl(image);

  const lowResUrl = isSVG
    ? maybeSignUri(svgToPngIfNeeded(image, false), { w: 150 })
    : getLowResUrl(image, { w: 150 });

  return {
    imageUrl: fullImage,
    lowResUrl,
  };
}
