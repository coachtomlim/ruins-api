export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type RecoveredContentRecord = {
  id: string;
  displayName: string;
  description: string;
  sourceFile: string;
  confidence: Confidence;
  notes: string;
};

export type AssetManifestRecord = {
  id: string;
  originalPath: string;
  assetType: string;
  likelyUse: string;
  fileSize: number;
  needsConversion: "yes" | "no";
  confidence: Confidence;
  licensingNotes: string;
};
