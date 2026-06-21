import {
  Car,
  DeviceMobile,
  SoccerBall,
  GasPump,
  Globe,
  FileText,
} from '@phosphor-icons/react';

const ICONS = {
  driver: Car,
  upi: DeviceMobile,
  playo: SoccerBall,
  petrol: GasPump,
  broadband: Globe,
};

export default function TemplateIcon({
  templateId,
  size = 28,
  weight = 'duotone',
  className,
  style,
  color,
}) {
  const Cmp = ICONS[templateId] || FileText;
  return <Cmp size={size} weight={weight} className={className} style={style} color={color} />;
}
