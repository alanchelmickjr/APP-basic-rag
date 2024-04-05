"use client";
import { Result } from "@/app/components/result";
import { Search } from "@/app/components/search";
import { Title } from "@/app/components/title";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function SearchPage() {
  const searchParams = useSearchParams();
  //@ts-ignore
  const query = decodeURIComponent(searchParams.get("q") || "");
  //@ts-ignore
  const rid = decodeURIComponent(searchParams.get("rid") || "");
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL);

  useEffect(() => {
    const localApiUrl = localStorage.getItem("apiUrl");
    if (localApiUrl) {
      setApiUrl(localApiUrl);
    }
  }, []);

  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [userId, setUserId] = useState("");
  const [availableUserIds, setAvailableUserIds] = useState([]);

  useEffect(() => {
    const localData = typeof window !== "undefined" ? localStorage.getItem("availableUserIds") : [];
    setAvailableUserIds(localData ? JSON.parse(localData) : []);
  }, []);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem("availableUserIds", JSON.stringify(availableUserIds));
  }, [availableUserIds]);

  useEffect(() => {
    if (availableUserIds.length === 0) {
      const newUserId = "063edaf8-3e63-4cb9-a4d6-a855f36376c3";
      setUserId(newUserId);
      setAvailableUserIds([newUserId]);
    } else {
      setUserId(availableUserIds[0]);
    }
  }, [availableUserIds]);

  useEffect(() => {
    const fetchUserDocuments = async () => {
      try {
        if (userId === "") return;
        const response = await fetch(
          `${apiUrl}/get_user_documents/?user_id=${userId}`
        );
        const data = await response.json();
        setUploadedDocuments(data.document_ids);
      } catch (error) {
        console.error("Error fetching user documents:", error);
      }
    };

    fetchUserDocuments();
  }, [userId, apiUrl]);

  const handleUserIdChange = async (selectedUserId) => {
    if (selectedUserId === "new") {
      const newUserId = uuidv4();
      setUserId(newUserId);
      setAvailableUserIds([...availableUserIds, newUserId]);
    } else {
      setUserId(selectedUserId);
    }

    try {
      const response = await fetch(
        `${apiUrl}/get_user_documents/?user_id=${selectedUserId}`
      );
      const data = await response.json();
      setUploadedDocuments(data.document_ids);
    } catch (error) {
      console.error("Error fetching user documents:", error);
    }
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (fileInputRef.current){
      // @ts-ignore
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append("document_id", file.name);
      formData.append("file", file);
      const metadata = {
        user_id: userId,
      };
      formData.append("metadata", JSON.stringify(metadata));
      setIsUploading(true);
      try {
        const response = await fetch(`${apiUrl}/upload_and_process_file/`, {
          method: "POST",
          body: formData,
        });
        await response.json();
        // @ts-ignore
        setUploadedDocuments([...uploadedDocuments, file.name]);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadButtonClick = () => {
    // @ts-ignore
    fileInputRef.current.click();
  };

  const handleApiUrlChange = (newApiUrl) => {
    setApiUrl(newApiUrl);
    localStorage.setItem("apiUrl", newApiUrl);
  };

  return (
    <div className="bg-zinc-900 min-h-screen pt-4 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <label htmlFor="apiUrl" className="block text-sm font-medium text-zinc-300 mb-1">
          Pipeline Deployment URL
        </label>
        <input
          type="text"
          id="apiUrl"
          name="apiUrl"
          value={apiUrl}
          onChange={(e) => handleApiUrlChange(e.target.value)}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-4"
        />
      </div>

      <div className="mx-auto max-w-6xl flex">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-800 px-2 sm:px-3 pt-2 sm:pt-3 rounded-l-2xl border-2 border-zinc-600">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-lg text-ellipsis font-bold text-blue-500">
              Documents
            </h2>
            <form onSubmit={handleDocumentUpload}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleDocumentUpload}
              />
              <button
                type="button"
                onClick={handleUploadButtonClick}
                disabled={isUploading}
                className={`pl-2 pr-2 text-white py-2 px-4 rounded-lg ${
                  isUploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </button>
            </form>
          </div>
          <hr className="border-t border-zinc-600 my-2" />
          <ul>
            {uploadedDocuments?.map((document, index) => (
              <li key={index} className="text-zinc-300 mb-2 text-sm">
                {document}
              </li>
            ))}
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-zinc-800 rounded-r-2xl relative overflow-hidden border-2 border-zinc-600">
          <div className="h-20 pointer-events-none w-full backdrop-filter absolute top-0"></div>
          <div className="px-4 md:px-8 pt-6 pb-24 h-full overflow-auto">
            <Title
              query={query}
              userId={userId}
              availableUserIds={availableUserIds}
              onUserIdChange={handleUserIdChange}
            ></Title>
            <Result
              key={rid}
              query={query}
              rid={rid}
              userId={userId}
              apiUrl={apiUrl}
              uploadedDocuments={uploadedDocuments}
             />
          </div>
          <div className="h-80 pointer-events-none w-full backdrop-filter absolute bottom-0 bg-gradient-to-b from-transparent to-zinc-900 [mask-image:linear-gradient(to_top,zinc-800,transparent)]"></div>
          <div className="absolute inset-x-0 bottom-6 px-4 md:px-8">
            <div className="w-full">
              <Search uploadedDocuments={uploadedDocuments}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
