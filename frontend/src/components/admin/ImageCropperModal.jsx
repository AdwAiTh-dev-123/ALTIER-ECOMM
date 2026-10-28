import { useState, useRef, useEffect, useCallback } from "react";

/**
 * ImageCropperModal
 * Manual, interactive crop tool with corner/edge resize handles,
 * orientation rotation (90 deg increments), and aspect ratio presets.
 */
export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  currentIndex = 0,
  totalImages = 1,
}) {
  // Ratio presets: 3/4 (portrait), 1 (square), or null (freeform manual)
  const [aspectRatio, setAspectRatio] = useState(3 / 4);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Display dimensions of the image in the container
  const [imgDisplaySize, setImgDisplaySize] = useState({ width: 0, height: 0 });

  // Crop box rectangle relative to the displayed image { x, y, width, height }
  const [cropBox, setCropBox] = useState({
    x: 20,
    y: 20,
    width: 200,
    height: 266,
  });

  // Active interaction: null | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  const [dragAction, setDragAction] = useState(null);
  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  });

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Initialize/Reset crop box whenever imageSrc, rotation, or isOpen changes
  const initCropBox = useCallback((displayWidth, displayHeight, ratio) => {
    if (!displayWidth || !displayHeight) return;

    let initWidth = displayWidth * 0.75;
    let initHeight = ratio ? initWidth / ratio : displayHeight * 0.75;

    // Constrain within bounds
    if (initHeight > displayHeight * 0.85) {
      initHeight = displayHeight * 0.85;
      if (ratio) initWidth = initHeight * ratio;
    }

    const initX = Math.max(0, (displayWidth - initWidth) / 2);
    const initY = Math.max(0, (displayHeight - initHeight) / 2);

    setCropBox({
      x: Math.round(initX),
      y: Math.round(initY),
      width: Math.round(initWidth),
      height: Math.round(initHeight),
    });
  }, []);

  // When image loads or modal opens, compute displayed size and position
  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;

    const displayW = img.clientWidth;
    const displayH = img.clientHeight;
    setImgDisplaySize({ width: displayW, height: displayH });
    initCropBox(displayW, displayH, aspectRatio);
  };

  useEffect(() => {
    setRotation(0);
    setAspectRatio(3 / 4);
  }, [imageSrc, isOpen]);

  // Handle aspect ratio toggle
  const handleRatioChange = (newRatio) => {
    setAspectRatio(newRatio);
    if (imgDisplaySize.width && imgDisplaySize.height) {
      initCropBox(imgDisplaySize.width, imgDisplaySize.height, newRatio);
    }
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Re-sync display size on window resize
  useEffect(() => {
    if (imgRef.current) {
      setImgDisplaySize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  }, [rotation]);

  // Global mousemove and mouseup listeners for smooth dragging
  useEffect(() => {
    if (!dragAction) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const initial = dragStartRef.current.box;
      const { width: maxW, height: maxH } = imgDisplaySize;

      let newBox = { ...initial };
      const minSize = 40; // minimum crop box dimension

      if (dragAction === "move") {
        newBox.x = Math.max(
          0,
          Math.min(maxW - initial.width, initial.x + deltaX),
        );
        newBox.y = Math.max(
          0,
          Math.min(maxH - initial.height, initial.y + deltaY),
        );
      } else {
        // Resizing handles
        if (dragAction.includes("e")) {
          newBox.width = Math.max(
            minSize,
            Math.min(maxW - initial.x, initial.width + deltaX),
          );
          if (aspectRatio) newBox.height = newBox.width / aspectRatio;
        }
        if (dragAction.includes("s")) {
          newBox.height = Math.max(
            minSize,
            Math.min(maxH - initial.y, initial.height + deltaY),
          );
          if (aspectRatio) newBox.width = newBox.height * aspectRatio;
        }
        if (dragAction.includes("w")) {
          const maxLeftShift = initial.x + initial.width - minSize;
          const possibleX = Math.max(
            0,
            Math.min(maxLeftShift, initial.x + deltaX),
          );
          newBox.width = initial.width + (initial.x - possibleX);
          newBox.x = possibleX;
          if (aspectRatio) newBox.height = newBox.width / aspectRatio;
        }
        if (dragAction.includes("n")) {
          const maxTopShift = initial.y + initial.height - minSize;
          const possibleY = Math.max(
            0,
            Math.min(maxTopShift, initial.y + deltaY),
          );
          newBox.height = initial.height + (initial.y - possibleY);
          newBox.y = possibleY;
          if (aspectRatio) newBox.width = newBox.height * aspectRatio;
        }

        // Boundary safety clamps
        if (newBox.x + newBox.width > maxW) newBox.width = maxW - newBox.x;
        if (newBox.y + newBox.height > maxH) newBox.height = maxH - newBox.y;
      }

      setCropBox(newBox);
    };

    const handleMouseUp = () => {
      setDragAction(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragAction, imgDisplaySize, aspectRatio]);

  const startDrag = (action, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragAction(action);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    };
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const isSideways = rotation === 90 || rotation === 270;
    const naturalW = isSideways ? img.naturalHeight : img.naturalWidth;
    const naturalH = isSideways ? img.naturalWidth : img.naturalHeight;

    const scaleX = naturalW / imgDisplaySize.width;
    const scaleY = naturalH / imgDisplaySize.height;

    const cropX = cropBox.x * scaleX;
    const cropY = cropBox.y * scaleY;
    const cropW = cropBox.width * scaleX;
    const cropH = cropBox.height * scaleY;

    const maxOutputWidth = 1000;
    const outputWidth = Math.min(cropW, maxOutputWidth);
    const outputHeight = outputWidth * (cropH / cropW);

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = naturalW;
    rotCanvas.height = naturalH;
    const rotCtx = rotCanvas.getContext("2d");

    rotCtx.translate(naturalW / 2, naturalH / 2);
    rotCtx.rotate((rotation * Math.PI) / 180);

    if (isSideways) {
      rotCtx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight,
      );
    } else {
      rotCtx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = Math.round(outputWidth);
    outCanvas.height = Math.round(outputHeight);
    const outCtx = outCanvas.getContext("2d");

    outCtx.drawImage(
      rotCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    outCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/webp",
      0.88,
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "620px",
          overflow: "hidden",
          color: "#fafafa",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
              Crop Product Photo
            </h3>
            {totalImages > 1 && (
              <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                Processing image {currentIndex + 1} of {totalImages}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              fontSize: "1.25rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Controls Toolbar: Aspect Ratio + Rotate */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #27272a",
            backgroundColor: "#121215",
          }}
        >
          {/* Ratio Buttons */}
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.8rem",
                color: "#a1a1aa",
                marginRight: "0.3rem",
              }}
            >
              Ratio:
            </span>
            <button
              type="button"
              onClick={() => handleRatioChange(3 / 4)}
              style={{
                padding: "4px 10px",
                fontSize: "0.78rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: aspectRatio === 3 / 4 ? "#fafafa" : "#3f3f46",
                backgroundColor:
                  aspectRatio === 3 / 4 ? "#27272a" : "transparent",
                color: "#fafafa",
                cursor: "pointer",
              }}
            >
              3:4 Portrait
            </button>
            <button
              type="button"
              onClick={() => handleRatioChange(1)}
              style={{
                padding: "4px 10px",
                fontSize: "0.78rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: aspectRatio === 1 ? "#fafafa" : "#3f3f46",
                backgroundColor: aspectRatio === 1 ? "#27272a" : "transparent",
                color: "#fafafa",
                cursor: "pointer",
              }}
            >
              1:1 Square
            </button>
            <button
              type="button"
              onClick={() => handleRatioChange(null)}
              style={{
                padding: "4px 10px",
                fontSize: "0.78rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: aspectRatio === null ? "#fafafa" : "#3f3f46",
                backgroundColor:
                  aspectRatio === null ? "#27272a" : "transparent",
                color: "#fafafa",
                cursor: "pointer",
              }}
            >
              Freeform
            </button>
          </div>

          {/* Orientation Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90 degrees clockwise"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "4px 12px",
              fontSize: "0.78rem",
              borderRadius: "4px",
              border: "1px solid #3f3f46",
              backgroundColor: "#27272a",
              color: "#fafafa",
              cursor: "pointer",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Rotate 90° ({rotation}°)
          </button>
        </div>

        {/* Cropper Interactive Canvas Stage */}
        <div
          ref={containerRef}
          style={{
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            userSelect: "none",
            minHeight: "420px",
            maxHeight: "65vh",
            overflow: "hidden",
          }}
        >
          {/* Image & Crop Box Wrapper */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                maxWidth: "460px",
                maxHeight: "55vh",
                objectFit: "contain",
                display: "block",
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.15s ease",
              }}
            />

            {/* Draggable & Resizable Crop Box */}
            {imgDisplaySize.width > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  outline: "2px solid #3b82f6",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                  cursor: "move",
                  boxSizing: "border-box",
                }}
                onMouseDown={(e) => startDrag("move", e)}
              >
                {/* Rule of thirds grid */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gridTemplateRows: "1fr 1fr 1fr",
                    border: "1px dashed rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <div
                    style={{
                      borderRight: "1px dashed rgba(255,255,255,0.2)",
                      borderBottom: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  />
                  <div
                    style={{
                      borderRight: "1px dashed rgba(255,255,255,0.2)",
                      borderBottom: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  />
                  <div
                    style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)" }}
                  />
                  <div
                    style={{
                      borderRight: "1px dashed rgba(255,255,255,0.2)",
                      borderBottom: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  />
                  <div
                    style={{
                      borderRight: "1px dashed rgba(255,255,255,0.2)",
                      borderBottom: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  />
                  <div
                    style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)" }}
                  />
                </div>

                {/* --- 4 Corner Resize Handles --- */}
                {/* Top-Left */}
                <div
                  onMouseDown={(e) => startDrag("nw", e)}
                  style={{
                    ...handleStyle,
                    top: "-5px",
                    left: "-5px",
                    cursor: "nwse-resize",
                  }}
                />
                {/* Top-Right */}
                <div
                  onMouseDown={(e) => startDrag("ne", e)}
                  style={{
                    ...handleStyle,
                    top: "-5px",
                    right: "-5px",
                    cursor: "nesw-resize",
                  }}
                />
                {/* Bottom-Left */}
                <div
                  onMouseDown={(e) => startDrag("sw", e)}
                  style={{
                    ...handleStyle,
                    bottom: "-5px",
                    left: "-5px",
                    cursor: "nesw-resize",
                  }}
                />
                {/* Bottom-Right */}
                <div
                  onMouseDown={(e) => startDrag("se", e)}
                  style={{
                    ...handleStyle,
                    bottom: "-5px",
                    right: "-5px",
                    cursor: "nwse-resize",
                  }}
                />

                {/* --- 4 Edge Handles (Available when Freeform is selected) --- */}
                {aspectRatio === null && (
                  <>
                    <div
                      onMouseDown={(e) => startDrag("n", e)}
                      style={{
                        ...edgeHandleStyle,
                        top: "-4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        cursor: "ns-resize",
                      }}
                    />
                    <div
                      onMouseDown={(e) => startDrag("s", e)}
                      style={{
                        ...edgeHandleStyle,
                        bottom: "-4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        cursor: "ns-resize",
                      }}
                    />
                    <div
                      onMouseDown={(e) => startDrag("w", e)}
                      style={{
                        ...edgeHandleStyle,
                        left: "-4px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "ew-resize",
                      }}
                    />
                    <div
                      onMouseDown={(e) => startDrag("e", e)}
                      style={{
                        ...edgeHandleStyle,
                        right: "-4px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "ew-resize",
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#18181b",
          }}
        >
          <span style={{ fontSize: "0.78rem", color: "#a1a1aa" }}>
            Drag inside to move • Drag handles to resize
          </span>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #3f3f46",
                backgroundColor: "transparent",
                color: "#fafafa",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#fafafa",
                color: "#09090b",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Apply & Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styling for corner handles
const handleStyle = {
  position: "absolute",
  width: "12px",
  height: "12px",
  backgroundColor: "#ffffff",
  border: "2px solid #3b82f6",
  borderRadius: "2px",
  zIndex: 10,
};

// Styling for edge handles
const edgeHandleStyle = {
  position: "absolute",
  width: "16px",
  height: "8px",
  backgroundColor: "#ffffff",
  border: "1px solid #3b82f6",
  borderRadius: "2px",
  zIndex: 10,
};
