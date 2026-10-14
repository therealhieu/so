use std::time::Duration;

/// A node's role in the cluster.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Follower,
    Candidate,
    Leader,
}

/// A randomized election timeout between 150 and 300 ms, so split votes are rare.
pub fn election_timeout(seed: u64) -> Duration {
    Duration::from_millis(150 + seed % 150)
}

/// The role a node takes when its election timeout fires.
pub fn on_timeout(role: Role) -> Role {
    match role {
        Role::Follower | Role::Candidate => Role::Candidate,
        Role::Leader => Role::Leader,
    }
}

pub fn tick(role: Role, seed: u64, elapsed: Duration) -> Role {
    let timeout = election_timeout(seed);
    if elapsed >= timeout {
        return on_timeout(role);
    }
    role
}
