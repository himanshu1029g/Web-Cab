import { db } from '../firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';

export const createTransaction = async (paymentData) => {
  try {
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      ...paymentData,
      timestamp: new Date()
    });
    return transactionRef.id;
  } catch (error) {
    throw new Error('Failed to create transaction');
  }
};

export const updateApplicationStatus = async (applicationId, transactionId) => {
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status: 'paid',
      transactionId,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error('Failed to update application status');
  }
};