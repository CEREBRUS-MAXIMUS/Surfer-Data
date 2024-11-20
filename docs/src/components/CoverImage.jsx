

import Image from 'next/image'
import cover_image from '../images/cover_image.png'

export default function CoverImage() {
  return <Image src={cover_image} alt="cover image" />
}
