/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { Card } from "@radix-ui/themes";
import { ImageIcon, Loader2, X } from "lucide-react";
import { useAioha } from "@aioha/react-provider";
import type { BusinessModel } from "../../../types/business";
import { useAuthData } from "../../../utils/auth-utils";
import { ApiService } from "../../../services/api";
import { DhiveService } from "../../../services/dhive-service";
import { toast } from "sonner";
import { useBusinesses } from "../../../hooks/useBusinesses";
import { BusinessConfirmationDialog } from "./BusinessConfirmationDialogue";

interface Props {
  businessData: BusinessModel;
  isMini: boolean;
  onPrevious: () => void;
  onCompleted: () => void;
  isOnboardingOnly?: boolean;
}

type BusinessWithFlags = BusinessModel & { isDeleted?: boolean };

function sanitizeBusiness(business: BusinessWithFlags): BusinessModel {
  const {
    isDeleted,
    createdAt,
    updatedAt,
    v,
    ...rest
  } = business;
  return rest;
}

export function BusinessFormStep7Onboarding({ businessData, isMini, onPrevious, onCompleted, isOnboardingOnly = false }: Props) {
  const { aioha } = useAioha();
  const { username, token } = useAuthData();
  const { createBusiness, updateBusiness } = useBusinesses();

  const receptionInputRef = useRef<HTMLInputElement | null>(null);
  const ownerInputRef = useRef<HTMLInputElement | null>(null);
  const insideInputRef = useRef<HTMLInputElement | null>(null);
  const exteriorInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [receptionPhotos, setReceptionPhotos] = useState<File[]>([]);
  const [ownerPhotos, setOwnerPhotos] = useState<File[]>([]);
  const [insidePhotos, setInsidePhotos] = useState<File[]>([]);
  const [exteriorPhotos, setExteriorPhotos] = useState<File[]>([]);
  const [logoPhotos, setLogoPhotos] = useState<File[]>([]);
  const [managerName, setManagerName] = useState("");
  const [description, setDescription] = useState("");
  const [question1, setQuestion1] = useState("");
  const [question2, setQuestion2] = useState("");
  const [question3, setQuestion3] = useState("");
  const [question4, setQuestion4] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingHiveLink, setIsSubmittingHiveLink] = useState(false);
  const [manualHivePostLink, setManualHivePostLink] = useState(
    businessData?.distriator?.verification?.hivePost ?? ""
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  const city = businessData?.location?.address?.city || "";
  const state = businessData?.location?.address?.state || "";
  const businessName = businessData?.profile?.displayName || "";

  const title = `I onboarded business ${businessName} from ${city}${state ? ", " + state : ""}`;
  const minCharsOk = description.trim().length >= 160;

  const handleFiles = async (files: FileList | null, setter: (files: File[]) => void, existing: File[]) => {
    if (!files) return;
    const selected = Array.from(files);
    const compressed = await Promise.all(selected.map((f) => compressImage(f, 1000, 1000, 0.8)));
    const next = [...existing, ...compressed].slice(0, 10);
    setter(next);
  };

  const removeAt = (index: number, setter: (f: File[]) => void, list: File[]) => {
    setter(list.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!token) throw new Error("No authentication token");
    return ApiService.uploadImage(file.name, file, token);
  };
  const ownerName = businessData.distriator.owner ?`@${businessData.distriator.owner}`:managerName;

  const buildBody = (ownerUrls: string[], receptionUrls: string[], insideUrls: string[], exteriorUrls: string[], logoUrls: string[]) => {
    const parts: string[] = [];
    parts.push(
      `Today, I have onboarded ${businessName}.\nI, as the trusted guide, certify that the business owner holds the keys to their Hive wallet and have been trained on how to use it.
    \nI talked to ${ownerName} & helped to onboard them to the Hive Ecosystem. I have given them enough knowledge so they know how to receive HBD and Bitcoin Lightning as a payment to enable customers claim cashback in HBD. Here are some photos of business owner with me.`
    );
    parts.push("");
    parts.push("#### Photo with business owner");
    ownerUrls.forEach((u) => parts.push(`![](${u})`));
    parts.push("-----");
    parts.push("#### Photo of Business's reception");
    receptionUrls.forEach((u) => parts.push(`![](${u})`));
    parts.push("-----");
    parts.push("#### Photos inside business");
    insideUrls.forEach((u) => parts.push(`![](${u})`));
    parts.push("-----");
    parts.push("#### Photo of Business Exterior");
    exteriorUrls.forEach((u) => parts.push(`![](${u})`));
    if (logoUrls.length > 0) {
      parts.push("-----");
      parts.push("#### Photo of Business Logo");
      logoUrls.forEach((u) => parts.push(`![](${u})`));
    }
    parts.push("-----");
    parts.push("### Other business Details");
    parts.push("");
    parts.push(description);
    parts.push("");
    parts.push("### Questions:");
    parts.push(`What does this business do? \n${question1}\n\n`);
    parts.push(`Describe the business atmosphere: \n${question2}\n\n`);
    parts.push(`Describe your interaction with the business and / or the business owner: \n${question3}\n\n`);
    parts.push(`Describe the type of clientele the business attracts: \n${question4}\n\n`);
    return parts.join("\n");
  };

  const handlePublishClick = () => {
    if (!username) {
      toast.error("Not logged in");
      return;
    }
    if (ownerPhotos.length === 0 || receptionPhotos.length === 0 || insidePhotos.length < 2 || exteriorPhotos.length === 0) {
      toast.error("Please add at least one photo in owner and reception sections, at least 2 photos inside business, and at least 1 exterior photo");
      return;
    }
    if (!minCharsOk || managerName.trim().length === 0) {
      toast.error("Please add manager name and at least 160 characters");
      return;
    }
    if (question1.trim().length < 30 || question2.trim().length < 30 || question3.trim().length < 30 || question4.trim().length < 30) {
      toast.error("Each question must have at least 30 characters");
      return;
    }
    if(isOnboardingOnly){
      publishAndCreate();
    }else{
      setShowConfirmation(true);
    }
  };

  const publishAndCreate = async () => {
    try {
      setIsProcessing(true);

      const [receptionUrls, ownerUrls, insideUrls, exteriorUrls, logoUrls] = await Promise.all([
        Promise.all(receptionPhotos.map(uploadImage)),
        Promise.all(ownerPhotos.map(uploadImage)),
        Promise.all(insidePhotos.map(uploadImage)),
        Promise.all(exteriorPhotos.map(uploadImage)),
        Promise.all(logoPhotos.map(uploadImage)),
      ]);

      const permlink = generateRandomString(8);
      const body = buildBody(ownerUrls, receptionUrls, insideUrls, exteriorUrls, logoUrls);
      const metadata: any = {
        tags: ["distriator", "onboarding", "spendhbd", "bizonboard"],
        app: "distriator/1.0.0",
        image: [...ownerUrls, ...receptionUrls, ...insideUrls, ...exteriorUrls, ...logoUrls],
        business_display_name: businessName,
        city: city,
        state: state,
        manager_name: managerName,
        format: "markdown",
      };

      const result = await aioha.comment(
        "",
        "hive-106130",
        permlink,
        title,
        body,
        metadata,
        {
          author: username,
          permlink: permlink,
          max_accepted_payout: "100000.000 HBD",
          percent_hbd: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [
            [
              0,
              {
                beneficiaries: [{ account: "distriator.bene", weight: 8000 }],
              },
            ],
          ],
        }
      );

      if (!result.success) {
        toast.error("Failed to publish onboarding post");
        setIsProcessing(false);
        return;
      }

      const postLink = `https://hive.blog/hive-106130/@${username}/${permlink}`;
      const baseBusiness = sanitizeBusiness(businessData as BusinessWithFlags);
      const updatedBusiness: BusinessModel = {
        ...baseBusiness,
        distriator: {
          ...baseBusiness?.distriator,
          verification: isMini
            ? undefined
            : {
                ...baseBusiness?.distriator?.verification,
                hivePost: postLink,
              },
        },
      };

      setManualHivePostLink(postLink);

      if (isOnboardingOnly) {
        await updateBusiness(updatedBusiness, true);
        toast.success("Onboarding post published and business updated");
        onCompleted();
      } else {
        await createBusiness(updatedBusiness, isMini);
        toast.success("Business created with onboarding post");
        onCompleted();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to complete onboarding");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHivePostSubmit = async () => {
    const trimmedLink = manualHivePostLink.trim();
    if (!trimmedLink) {
      toast.error("Please provide a Hive post link");
      return;
    }

    try {
      setIsSubmittingHiveLink(true);

      const postExists = await DhiveService.checkHivePostExists(trimmedLink);

      if (!postExists) {
        toast.error("Hive post could not be verified. Please check the URL and try again.");
        return;
      }

      const baseBusiness = sanitizeBusiness(businessData as BusinessWithFlags);
      const updatedBusiness: BusinessModel = {
        ...baseBusiness,
        distriator: {
          ...baseBusiness?.distriator,
          verification: {
            ...baseBusiness?.distriator?.verification,
            hivePost: trimmedLink,
          },
        },
      };

      if (isOnboardingOnly) {
        await updateBusiness(updatedBusiness, true);
        toast.success("Hive post link saved to business");
        onCompleted();
      } else {
        await createBusiness(updatedBusiness, isMini);
        toast.success("Hive post link saved");
        onCompleted();
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to submit Hive post link");
    } finally {
      setIsSubmittingHiveLink(false);
    }
  };

  return (
    <Card>
      <div className="p-6 bg-background/50 border border-border/50 rounded-lg">
        {(!isMini || isOnboardingOnly) && (
          <div className="mb-4 flex items-center gap-4 justify-center">
          <img src={businessData.profile.displayImage} alt="Onboarding" className="rounded-lg w-10 h-10 object-cover" />
          <p className="text-2xl font-semibold">
            {businessData.profile.displayName}
          </p>
        </div>)}
        {/* Owner photos */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Photo with Owner/Manager  <span className="text-red-500">*</span></h4>
          <input
            ref={ownerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="owner-photos"
            multiple
            onChange={async (e) => {
              await handleFiles(e.target.files, setOwnerPhotos, ownerPhotos);
            }}
          />
          <button
            type="button"
            onClick={() => ownerInputRef.current?.click()}
            className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          {ownerPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {ownerPhotos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeAt(idx, setOwnerPhotos, ownerPhotos)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reception photos */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Reception/Billing Counter Photos  <span className="text-red-500">*</span></h4>
          <input
            ref={receptionInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="reception-photos"
            multiple
            onChange={async (e) => {
              await handleFiles(e.target.files, setReceptionPhotos, receptionPhotos);
            }}
          />
          <button
            type="button"
            onClick={() => receptionInputRef.current?.click()}
            className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          {receptionPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {receptionPhotos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeAt(idx, setReceptionPhotos, receptionPhotos)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inside business photos */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Photos inside business <span className="text-red-500">*</span></h4>
          <input
            ref={insideInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="inside-photos"
            multiple
            onChange={async (e) => {
              await handleFiles(e.target.files, setInsidePhotos, insidePhotos);
            }}
          />
          <button
            type="button"
            onClick={() => insideInputRef.current?.click()}
            className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          {insidePhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {insidePhotos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeAt(idx, setInsidePhotos, insidePhotos)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`text-sm mt-1 ${insidePhotos.length >= 2 ? "text-gray-400" : "text-red-500"}`}>
            {insidePhotos.length} / 2 photos required
          </div>
        </div>

        {/* Exterior photos */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Photo of Business Exterior <span className="text-red-500">*</span></h4>
          <input
            ref={exteriorInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="exterior-photos"
            multiple
            onChange={async (e) => {
              await handleFiles(e.target.files, setExteriorPhotos, exteriorPhotos);
            }}
          />
          <button
            type="button"
            onClick={() => exteriorInputRef.current?.click()}
            className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          {exteriorPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {exteriorPhotos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeAt(idx, setExteriorPhotos, exteriorPhotos)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logo photos */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Photo of Business Logo</h4>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            id="logo-photos"
            multiple
            onChange={async (e) => {
              await handleFiles(e.target.files, setLogoPhotos, logoPhotos);
            }}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          {logoPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {logoPhotos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => removeAt(idx, setLogoPhotos, logoPhotos)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager + description */}
        <div className="mb-6">
          <h4 className="font-semibold mb-4">Business Details</h4>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business owner / Manager's first name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Enter name here"
                className="w-full px-3 py-2 rounded border bg-muted/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write at least 5 lines and minimum 160 characters about the business"
                className="min-h-[160px] w-full resize-none bg-muted/50 border border-border rounded-lg p-3"
              />
              <div className={`text-sm mt-1 ${minCharsOk ? "text-gray-400" : "text-red-500"}`}>
                {description.trim().length} / 160
              </div>
            </div>
          </div>
        </div>

        {/* Questions section */}
        <div className="mb-6">
          <h4 className="font-semibold mb-4">Questions</h4>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">What does this business do? <span className="text-red-500">*</span></label>
              <textarea
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                placeholder="Answer here (min 30 characters)"
                className="w-full min-h-[80px] resize-none bg-muted/50 border border-border rounded-lg p-3"
              />
              <div className={`text-sm mt-1 ${question1.trim().length >= 30 ? "text-gray-400" : "text-red-500"}`}>
                {question1.trim().length} / 30
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Describe the business atmosphere <span className="text-red-500">*</span></label>
              <textarea
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                placeholder="Answer here (min 30 characters)"
                className="w-full min-h-[80px] resize-none bg-muted/50 border border-border rounded-lg p-3"
              />
              <div className={`text-sm mt-1 ${question2.trim().length >= 30 ? "text-gray-400" : "text-red-500"}`}>
                {question2.trim().length} / 30
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Describe your interaction with the business and / or the business owner <span className="text-red-500">*</span></label>
              <textarea
                value={question3}
                onChange={(e) => setQuestion3(e.target.value)}
                placeholder="Answer here (min 30 characters)"
                className="w-full min-h-[80px] resize-none bg-muted/50 border border-border rounded-lg p-3"
              />
              <div className={`text-sm mt-1 ${question3.trim().length >= 30 ? "text-gray-400" : "text-red-500"}`}>
                {question3.trim().length} / 30
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Describe the type of clientele the business attracts <span className="text-red-500">*</span></label>
              <textarea
                value={question4}
                onChange={(e) => setQuestion4(e.target.value)}
                placeholder="Answer here (min 30 characters)"
                className="w-full min-h-[80px] resize-none bg-muted/50 border border-border rounded-lg p-3"
              />
              <div className={`text-sm mt-1 ${question4.trim().length >= 30 ? "text-gray-400" : "text-red-500"}`}>
                {question4.trim().length} / 30
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          {!isMini && <button className="btn" onClick={onPrevious}>Back</button>}
          <button
            onClick={handlePublishClick}
            disabled={isProcessing || !minCharsOk || !managerName.trim() || ownerPhotos.length === 0 || receptionPhotos.length === 0 || insidePhotos.length < 2 || exteriorPhotos.length === 0 || question1.trim().length < 30 || question2.trim().length < 30 || question3.trim().length < 30 || question4.trim().length < 30}
            className="btn btn-outline btn-primary flex items-center gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isOnboardingOnly ? "Publish" : "Publish & Create Business"}
          </button>
        </div>
        {isOnboardingOnly && (
          <div className="mt-8 p-4 border border-border/50 rounded-lg bg-background/30">
            <h4 className="font-semibold mb-2">
              Already have a Hive onboarding post?
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Paste the Hive post URL below to link it to this business without
              publishing a new one.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={manualHivePostLink}
                onChange={(e) => setManualHivePostLink(e.target.value)}
                placeholder="https://hive.blog/..."
                className="flex-1 px-3 py-2 rounded border bg-muted/50"
              />
              <button
                type="button"
                onClick={handleHivePostSubmit}
                disabled={isSubmittingHiveLink || !manualHivePostLink.trim()}
                className="btn btn-primary"
              >
                {isSubmittingHiveLink ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Submit Hive Post"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <BusinessConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={publishAndCreate}
        isLoading={isProcessing}
        isQuickAdd={isMini}
      />
    </Card>
  );
}

function generateRandomString(length: number) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

async function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
  const img = document.createElement("img");
  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  await img.decode();

  let { width, height } = img;
  if (width > height) {
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(img, 0, 0, width, height);

  return await new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);
      if (!blob) return resolve(file);
      resolve(new File([blob], file.name, { type: blob.type }));
    }, "image/jpeg", quality);
  });
}


