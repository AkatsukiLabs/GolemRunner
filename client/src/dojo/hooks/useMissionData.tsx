import { useMemo } from "react";
import { Mission } from '../bindings';
import { isMissionFromToday } from '../../utils/TimeHelpers';

interface UseMissionDataReturn {
  todayMissions: Mission[];
  pendingMissions: Mission[];
  completedMissions: Mission[];
  hasData: boolean;
}

export const useMissionData = (missions: Mission[]): UseMissionDataReturn => {
  
  const todayMissions = useMemo(() => {
    if (!Array.isArray(missions)) return [];
    
    return missions.filter(mission => {
      try {
        return isMissionFromToday(mission.created_at);
      } catch (error) {
        return false;
      }
    });
  }, [missions]);

  const pendingMissions = useMemo(() => {
    return todayMissions.filter((mission) => {
      try {
        let statusVariant = "Pending";
        
        if (mission.status && typeof mission.status.activeVariant === 'function') {
          statusVariant = mission.status.activeVariant();
        } else if (mission.status && typeof mission.status === 'object') {
          const statusObj = mission.status as any;
          
          if (statusObj.variant) {
            if (statusObj.variant.Pending !== undefined) statusVariant = "Pending";
            else if (statusObj.variant.Completed !== undefined) statusVariant = "Completed";
          }
          else if (statusObj.Pending !== undefined) statusVariant = "Pending";
          else if (statusObj.Completed !== undefined) statusVariant = "Completed";
        }
        
        return statusVariant === 'Pending';
      } catch (error) {
        return true; // Assume pending on error
      }
    });
  }, [todayMissions]);

  const completedMissions = useMemo(() => {
    return todayMissions.filter(mission => {
      try {
        let statusVariant = "Pending";
        
        if (mission.status && typeof mission.status.activeVariant === 'function') {
          statusVariant = mission.status.activeVariant();
        } else if (mission.status && typeof mission.status === 'object') {
          const statusObj = mission.status as any;
          
          if (statusObj.variant) {
            if (statusObj.variant.Completed !== undefined) statusVariant = "Completed";
            else if (statusObj.variant.Pending !== undefined) statusVariant = "Pending";
          }
          else if (statusObj.Completed !== undefined) statusVariant = "Completed";
          else if (statusObj.Pending !== undefined) statusVariant = "Pending";
        }
        
        return statusVariant === 'Completed';
      } catch (error) {
        return false;
      }
    });
  }, [todayMissions]);

  const hasData = todayMissions.length > 0;

  return {
    todayMissions,
    pendingMissions,
    completedMissions,
    hasData
  };
};