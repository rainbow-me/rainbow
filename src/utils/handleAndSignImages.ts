import isSVGImage from '@/utils/isSVG';
import { getFullSizeUrl } from '@/utils/handleNFTImages';
import { maybeSignUri } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { getLowResUrl } from '@/utils/getLowResUrl';
import { CardSize } from '@/components/unique-token/CardSize';

export function handleAndSignImages(
  imageUrl?: string,
  previewUrl?: string,
  originalUrl?: string
): {
  imageUrl?: string;
  lowResUrl?: string;
} {
  const image = imageUrl || previewUrl || originalUrl;

  if (!image) {
    return {};
  }

  const isSVG = isSVGImage(image);
  const fullImage = isSVG ? image : getFullSizeUrl(image);

  const lowResUrl = isSVG
    ? maybeSignUri(svgToPngIfNeeded(image, false), { w: CardSize })
    : getLowResUrl(image, { w: CardSize });

  return {
    imageUrl: fullImage,
    lowResUrl,
  };
}
