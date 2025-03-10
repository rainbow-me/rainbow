import { Skia } from '@shopify/react-native-skia';

export const plusButtonSvg = () =>
  Skia.SVG.MakeFromString(
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_940_15285)">
  <g filter="url(#filter0_i_940_15285)">
  <path d="M12.0107 23.8916C10.249 23.8916 9.19629 22.7529 9.19629 20.9053V14.7607H3.33105C1.56934 14.7607 0.452148 13.7295 0.452148 12.0107C0.452148 10.3135 1.56934 9.28223 3.33105 9.28223H9.19629V3.09473C9.19629 1.26855 10.2705 0.108398 12.0107 0.108398C13.751 0.108398 14.8037 1.26855 14.8037 3.09473V9.28223H20.6475C22.4307 9.28223 23.5479 10.3135 23.5479 12.0107C23.5479 13.7295 22.4092 14.7607 20.626 14.7607H14.8037V20.9053C14.8037 22.7529 13.751 23.8916 12.0107 23.8916Z" fill="black" fill-opacity="0.2"/>
  </g>
  </g>
  <defs>
  <filter id="filter0_i_940_15285" x="0.452148" y="0.108398" width="23.0957" height="26.3432" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
  <feOffset dy="2.56"/>
  <feGaussianBlur stdDeviation="1.28"/>
  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0"/>
  <feBlend mode="normal" in2="shape" result="effect1_innerShadow_940_15285"/>
  </filter>
  <clipPath id="clip0_940_15285">
  <rect width="24" height="24" fill="white"/>
  </clipPath>
  </defs>
  </svg>`
  );

export const stars = {
  one: () =>
    Skia.SVG.MakeFromString(
      `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_835_52552)">
    <path d="M7.87953 3.48138C7.90199 3.34505 8.09801 3.34505 8.12047 3.48138L8.72823 7.17114C8.73674 7.22279 8.77721 7.26326 8.82886 7.27177L12.5186 7.87953C12.655 7.90199 12.655 8.09801 12.5186 8.12047L8.82886 8.72823C8.77721 8.73674 8.73674 8.77721 8.72823 8.82886L8.12047 12.5186C8.09801 12.655 7.90199 12.655 7.87953 12.5186L7.27177 8.82886C7.26326 8.77721 7.22279 8.73674 7.17114 8.72823L3.48138 8.12047C3.34505 8.09801 3.34505 7.90199 3.48138 7.87953L7.17114 7.27177C7.22279 7.26326 7.26326 7.22279 7.27177 7.17114L7.87953 3.48138Z" fill="#FFFF55"/>
    </g>
    <defs>
    <filter id="filter0_f_835_52552" x="0.378906" y="0.378906" width="15.2422" height="15.2422" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="1.5" result="effect1_foregroundBlur_835_52552"/>
    </filter>
    </defs>
    </svg>`
    ),
  two: () =>
    Skia.SVG.MakeFromString(
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_835_52551)">
    <path d="M11.8279 5.54483C11.86 5.35007 12.14 5.35007 12.1721 5.54483L13.0403 10.8159C13.0525 10.8897 13.1103 10.9475 13.1841 10.9597L18.4552 11.8279C18.6499 11.86 18.6499 12.14 18.4552 12.1721L13.1841 13.0403C13.1103 13.0525 13.0525 13.1103 13.0403 13.1841L12.1721 18.4552C12.14 18.6499 11.86 18.6499 11.8279 18.4552L10.9597 13.1841C10.9475 13.1103 10.8897 13.0525 10.8159 13.0403L5.54483 12.1721C5.35007 12.14 5.35007 11.86 5.54483 11.8279L10.8159 10.9597C10.8897 10.9475 10.9475 10.8897 10.9597 10.8159L11.8279 5.54483Z" fill="#FFFF55"/>
    </g>
    <defs>
    <filter id="filter0_f_835_52551" x="0.898438" y="0.898926" width="22.2031" height="22.2021" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="2.25" result="effect1_foregroundBlur_835_52551"/>
    </filter>
    </defs>
    </svg>`
    ),
  three: () =>
    Skia.SVG.MakeFromString(
      `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_f_835_52549)">
    <path d="M10.3508 4.90552C10.3786 4.73672 10.6214 4.73672 10.6492 4.90552L11.4016 9.47379C11.4122 9.53773 11.4623 9.58785 11.5262 9.59838L16.0945 10.3508C16.2633 10.3786 16.2633 10.6214 16.0945 10.6492L11.5262 11.4016C11.4623 11.4122 11.4122 11.4623 11.4016 11.5262L10.6492 16.0945C10.6214 16.2633 10.3786 16.2633 10.3508 16.0945L9.59838 11.5262C9.58785 11.4623 9.53773 11.4122 9.47379 11.4016L4.90552 10.6492C4.73672 10.6214 4.73672 10.3786 4.90552 10.3508L9.47379 9.59838C9.53773 9.58785 9.58785 9.53773 9.59838 9.47379L10.3508 4.90552Z" fill="#FFFF55"/>
    </g>
    <defs>
    <filter id="filter0_f_835_52549" x="0.779297" y="0.778809" width="19.4414" height="19.4424" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_835_52549"/>
    </filter>
    </defs>
    </svg>`
    ),
};
