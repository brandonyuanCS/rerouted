"""
Tabu list management for the search algorithm.
"""

from dataclasses import dataclass, field

from optimizer.types import Move


@dataclass
class TabuList:
    """
    Manages the tabu list for forbidden moves.
    Uses recency-based tabu with fixed tenure.
    """
    tenure: int = 7
    entries: dict[str, int] = field(default_factory=dict)  # move_key -> iteration added
    
    def is_tabu(self, move: Move, current_iter: int) -> bool:
        """Check if a move is currently tabu."""
        move_key = move.key()
        if move_key not in self.entries:
            return False
        return (current_iter - self.entries[move_key]) < self.tenure
    
    def add(self, move: Move, current_iter: int) -> None:
        """Add a move to the tabu list."""
        self.entries[move.key()] = current_iter
        self._cleanup(current_iter)
    
    def _cleanup(self, current_iter: int) -> None:
        """Remove expired entries."""
        self.entries = {
            k: v for k, v in self.entries.items()
            if current_iter - v < self.tenure
        }
    
    def size(self) -> int:
        """Current size of tabu list."""
        return len(self.entries)


def aspiration_criterion(
    move: Move,
    neighbor_score: float,
    best_ever_score: float,
    tabu_list: TabuList,
    current_iter: int,
) -> bool:
    """
    Determine if a move should be accepted despite being tabu.
    
    Aspiration: Accept tabu move if it produces the best solution ever seen.
    """
    # Not tabu? Always consider
    if not tabu_list.is_tabu(move, current_iter):
        return True
    
    # Tabu but beats best ever? Aspiration!
    if neighbor_score < best_ever_score:
        return True
    
    return False
