import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { EVALUATION_ITEMS } from '../constants';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Check, ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';

export default function EvaluationForm() {
  const { sectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [section, setSection] = useState<any>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSection() {
      if (!sectionId) return;
      try {
        const docRef = doc(db, 'sections', sectionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSection({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Section not found");
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSection();
  }, [sectionId, navigate]);

  const handleRate = (itemId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const isFormComplete = EVALUATION_ITEMS.every(item => ratings[item.id] !== undefined);

  const handleSubmit = async () => {
    if (!isFormComplete || !user || !section) {
      toast.error("Please complete all fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const evaluationData = {
        type: user.role === 'SUPERVISOR' ? 'SAF' : 'SET',
        evaluatorId: user.uid,
        targetFacultyId: section.facultyId,
        sectionId: section.id,
        academicPeriodId: section.academicPeriodId,
        scores: EVALUATION_ITEMS.map(item => ratings[item.id]),
        comments: comments,
        timestamp: serverTimestamp(),
      };

      const path = 'evaluations';
      await addDoc(collection(db, path), evaluationData);
      
      toast.success("Evaluation submitted successfully! Thank you for your feedback.");
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'evaluations');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-mono animate-pulse uppercase italic">Synchronizing Form Data...</div>;
  if (!section) return null;

  return (
    <div className="min-h-screen bg-[#F0F0EE] font-sans text-[#141414] pb-20">
       <header className="border-b border-[#141414] bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-none border border-[#141414] hover:bg-[#141414] hover:text-white h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            BACK
          </Button>
          <h1 className="font-mono font-black text-lg uppercase tracking-tight">ANNEX_A_ELECTRONIC_SET</h1>
        </div>
        <Badge className="rounded-none bg-[#141414] text-white">READY_FOR_SUBMISSION</Badge>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 mt-4 space-y-8">
        <Card className="rounded-none border-2 border-[#141414] bg-white shadow-[4px_4px_0px_0px_#141414]">
          <CardHeader className="border-b border-[#141414]">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-mono uppercase font-black">{section.courseName}</CardTitle>
                <p className="font-serif italic text-lg opacity-60">
                  {section.courseCode} — Section {section.sectionName}
                </p>
              </div>
              <div className="text-right font-mono text-xs uppercase opacity-40">
                DATE: {new Date().toLocaleDateString()}<br/>
                USER_ID: {user?.uid.slice(0, 8)}...
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-[#141414] text-white px-6 py-4">
              <p className="text-sm font-serif italic">
                Instruction: Rate the professor based on your experience for each item below. 
                5 = Excellent, 1 = Poor. Evaluation is confidential.
              </p>
            </div>

            <div className="divide-y divide-[#141414]">
              {EVALUATION_ITEMS.map((item, index) => (
                <div key={item.id} className="p-6 md:p-8 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <span className="font-mono font-bold text-xl opacity-20">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="text-[10px] font-mono uppercase font-bold opacity-40 mb-1">{item.category}</p>
                          <p className="text-lg font-medium leading-tight">{item.text}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {[1, 2, 3, 4, 5].map((num) => (
                         <button
                           key={num}
                           onClick={() => handleRate(item.id, num)}
                           className={`w-10 h-10 border-2 font-mono font-bold flex items-center justify-center transition-all ${
                             ratings[item.id] === num 
                               ? 'bg-[#141414] text-white border-[#141414] scale-110 shadow-md' 
                               : 'border-[#141414] text-[#141414] hover:bg-gray-200'
                           }`}
                         >
                           {num}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-[#141414] bg-white">
          <CardHeader>
            <CardTitle className="font-mono uppercase font-black">Qualitative Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase opacity-60">Comments & Suggestions</Label>
              <Textarea 
                placeholder="Share your thoughts anonymously..." 
                className="rounded-none border-2 border-[#141414] min-h-[150px] font-serif italic text-lg focus-visible:ring-0"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-[#141414] p-6 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-mono uppercase opacity-60">
              {isFormComplete ? (
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <Check className="w-4 h-4" /> ALL_ITEMS_READY
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                  <AlertTriangle className="w-4 h-4" /> PENDING_{EVALUATION_ITEMS.length - Object.keys(ratings).length}_ITEMS
                </div>
              )}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormComplete || submitting}
              className="rounded-none bg-[#141414] text-white hover:bg-white hover:text-[#141414] border border-[#141414] font-mono uppercase font-black h-12 px-8"
            >
              {submitting ? 'PROCESSING...' : 'SUBMIT_EVALUATION'}
              <Send className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
