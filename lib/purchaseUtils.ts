// lib/purchaseUtils.ts 
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';


export async function checkUserPurchase(userId: string, courseId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
         
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking purchase:', error);
    return false;
  }
}


export async function recordPurchase(userId: string, courseId: string): Promise<void> {
  try {
    await addDoc(collection(db, 'purchases'), {
      userId,
      courseId,
      purchaseDate: new Date(),
      status: 'completed'
    });
    console.log('Purchase recorded successfully:', { userId, courseId });
  } catch (error) {
    console.error('Error recording purchase:', error);
    throw error;
  }
}


export async function saveCourseProgress(
  userId: string, 
  courseId: string, 
  progress: number
): Promise<void> {
  try {
    
    const progressQuery = query(
      collection(db, 'courseProgress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const querySnapshot = await getDocs(progressQuery);
    
    if (!querySnapshot.empty) {
      const progressDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'courseProgress', progressDoc.id), {
        progress: Math.min(100, Math.max(0, progress)), 
        lastUpdated: new Date(),
        completed: progress === 100
      });
    } else {
      
      await addDoc(collection(db, 'courseProgress'), {
        userId,
        courseId,
        progress: Math.min(100, Math.max(0, progress)),
        lastUpdated: new Date(),
        completed: progress === 100,
        createdAt: new Date()
      });
    }
    
    console.log('✅ Progress saved:', { userId, courseId, progress });
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
}


export async function getCourseProgress(
  userId: string, 
  courseId: string
): Promise<number> {
  try {
    const progressQuery = query(
      collection(db, 'courseProgress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const querySnapshot = await getDocs(progressQuery);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return data.progress || 0;
    }
    
    return 0; 
  } catch (error) {
    console.error('Error getting progress:', error);
    return 0;
  }
}