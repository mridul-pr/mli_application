// Watermark.js
import React from "react";
import "./Watermark.scss"; // Import the CSS file for styling

const Watermark = ({ text = "Watermark Text" }) => {
  return (
    <div className="watermark">
      <span className="watermark-prefix">@Powered by: </span>
      <span>{text}</span>
    </div>
  );
};

export default Watermark;
