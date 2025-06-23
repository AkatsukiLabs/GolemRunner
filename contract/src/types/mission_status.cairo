#[derive(Copy, Drop, Serde, Debug, Introspect, PartialEq)]
pub enum MissionStatus {
    Pending,
    Completed,
    Claimed
}

pub impl IntoMissionStatusFelt252 of Into<MissionStatus, felt252> {
    #[inline(always)]
    fn into(self: MissionStatus) -> felt252 {
        match self {
            MissionStatus::Pending => 0,
            MissionStatus::Completed => 1,
            MissionStatus::Claimed => 2,
        }
    }
}

pub impl IntoMissionStatusU8 of Into<MissionStatus, u8> {
    #[inline(always)]
    fn into(self: MissionStatus) -> u8 {
        match self {
            MissionStatus::Pending => 0,
            MissionStatus::Completed => 1,
            MissionStatus::Claimed => 2,
        }
    }
}

pub impl Intou8MissionStatus of Into<u8, MissionStatus> {
    #[inline(always)]
    fn into(self: u8) -> MissionStatus {
        let mission: u8 = self.into();
        match mission {
            0 => MissionStatus::Pending,
            1 => MissionStatus::Completed,
            2 => MissionStatus::Claimed,
            _ => MissionStatus::Pending,
        }
    }
}

pub impl MissionStatusDisplay of core::fmt::Display<MissionStatus> {
    fn fmt(self: @MissionStatus, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let s = match self {
            MissionStatus::Pending => "Pending",
            MissionStatus::Completed => "Completed",
            MissionStatus::Claimed => "Claimed",
        };
        f.buffer.append(@s);
        Result::Ok(())
    }
}
