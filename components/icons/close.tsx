import { Path, Svg } from "react-native-svg";

const CloseIcon = (props: any) => (
  <Svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    color="currentColor"
    fill="none"
  >
    <Path
      d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085"
      stroke="#141B34"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default CloseIcon;
