"use client";

import { useEffect } from "react";

export function Calendly() {
  useEffect(() => {
    let scriptSrc = "https://assets.calendly.com/assets/external/widget.js";
    let script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      const calendlyWidget = document.querySelector(".calendly-inline-widget");
      if (calendlyWidget) {
        calendlyWidget.setAttribute(
          "data-url",
          "https://calendly.com/hansu/han-meeting?back=1"
        );
      }
    };
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector(
        `script[src="${scriptSrc}"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div id="calendar" className="w-full h-[700px] bg-white rounded_box">
        <div
          className="calendly-inline-widget"
          data-url="https://calendly.com/hansu/han-meeting?back=1"
          style={{ minWidth: "320px", height: "700px" }}
        ></div>
      </div>
    </div>
  );
}
