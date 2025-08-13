// hooks/useVerseData.ts
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface VerseData {
  verse: string | null;
  reference: string | null;
  prayerContent: string | null;
  chapterText: string | null;
  chapterReference: string | null;
  bibleVersion: string | null;
  formattedDate: string;
  loading: boolean;
}

export function useVerseData(offsetDays: number = 0): VerseData {
  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [prayerContent, setPrayerContent] = useState<string | null>(null);
  const [chapterText, setChapterText] = useState<string | null>(null);
  const [chapterReference, setChapterReference] = useState<string | null>(null);
  const [bibleVersion, setBibleVersion] = useState<string | null>(null);

  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);

  const dateId = date.toISOString().split("T")[0];
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const docRef = doc(db, "dailyContent", dateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerse(data.verse ?? null);
          setReference(data.reference ?? null);
          setPrayerContent(data.prayerContent ?? null);
          setChapterText(data.chapterText ?? null);
          setChapterReference(data.chapterReference ?? null);
          setBibleVersion(data.bibleVersion ?? null);
        } else {
          setVerse(null);
          setReference(null);
          setPrayerContent(null);
          setChapterText(null);
          setChapterReference(null);
          setBibleVersion(null);
        }
      } catch (err) {
        console.error("Error fetching verse:", err);
        setVerse(null);
        setReference(null);
        setPrayerContent(null);
        setChapterText(null);
        setChapterReference(null);
        setBibleVersion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [dateId]);

  return {
    verse,
    reference,
    prayerContent,
    chapterText,
    chapterReference,
    bibleVersion,
    formattedDate,
    loading,
  };
}
