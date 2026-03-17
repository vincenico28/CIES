import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface IDVerificationStatus {
  isVerified: boolean;
  status: "pending" | "approved" | "rejected" | null;
  loading: boolean;
  error: string | null;
}

export function useIDVerification(): IDVerificationStatus {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchVerificationStatus = async () => {
      try {
        const { data, error: err } = await supabase
          .from("profiles")
          .select("id_verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (err) throw err;

        const verificationStatus = data?.id_verification_status;
        setStatus(verificationStatus as "pending" | "approved" | "rejected" | null);
        setIsVerified(verificationStatus === "approved");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch verification status");
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [user]);

  return { isVerified, status, loading, error };
}
