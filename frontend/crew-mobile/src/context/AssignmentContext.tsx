import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Assignment } from '../components/AssignmentCard'; // Assuming types are exported from here, or we redefine

// If Assignment type is not exported, we might need to redefine or import it.
// Checking AssignmentCard.tsx, 'Assignment' IS exported.
// We need to verify path. ../components/AssignmentCard seems correct if this is in src/context

interface AssignmentContextType {
    currentAssignment: Assignment | undefined;
    systemStatus: 'pending' | 'completed';
    acceptAssignment: (assignment: Assignment) => void;
    setCurrentAssignment: (assignment: Assignment | undefined) => void; // Optional if we need to set initial
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial state defined by requirements:
    // "change status to system status to completed in green only when i accept, I want it to say pending in yellow before that"
    // Implication: Initial status is 'pending'.
    // Initial assignment: We should probably keep the "current" one (AA1036) or start empty?
    // "update with the one I accepted" -> implies there was an old one.
    // I will initialize with undefined or text saying "Pending Assignment" if the dashboard handles undefined.
    // But Dashboard previously derived AA1036. I will simulate AA1036 as the "old" one, OR start empty if the story is "optimization invalidated current".
    // Let's assume we start with the OLD assignment (AA1036) but status is PENDING because an update is required.

    const [currentAssignment, setCurrentAssignment] = useState<Assignment | undefined>({
        id: 'AA1036',
        flightNumber: 'AA 1036',
        origin: 'DFW',
        destination: 'LGA',
        departureTime: '10:00',
        gate: 'C12',
        role: 'pilot',
        status: 'active',
        aircraftType: 'Boeing 737-800'
    }); // Start with original

    const [systemStatus, setSystemStatus] = useState<'pending' | 'completed'>('pending');

    const acceptAssignment = (assignment: Assignment) => {
        // When accepting, we replace the current assignment with the new one
        // And mark status as completed (active)
        const newAssignment = { ...assignment, status: 'active' as const };
        setCurrentAssignment(newAssignment);
        setSystemStatus('completed');
    };

    return (
        <AssignmentContext.Provider value={{ currentAssignment, systemStatus, acceptAssignment, setCurrentAssignment }}>
            {children}
        </AssignmentContext.Provider>
    );
};

export const useAssignment = () => {
    const context = useContext(AssignmentContext);
    if (context === undefined) {
        throw new Error('useAssignment must be used within an AssignmentProvider');
    }
    return context;
};
