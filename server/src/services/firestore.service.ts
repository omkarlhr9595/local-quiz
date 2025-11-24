import { db } from "../config/firebase.js";
import type { Quiz, Game, Contestant } from "../../../shared/types/index.js";

// Quiz Service
export const quizService = {
  /**
   * Create a new quiz
   */
  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const quizRef = db.collection("quizzes").doc();
    const newQuiz: Quiz = {
      ...quiz,
      id: quizRef.id,
      createdAt: new Date(),
    };

    await quizRef.set({
      ...newQuiz,
      createdAt: newQuiz.createdAt.toISOString(),
    });

    return newQuiz;
  },

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string): Promise<Quiz | null> {
    const quizDoc = await db.collection("quizzes").doc(quizId).get();

    if (!quizDoc.exists) {
      return null;
    }

    const data = quizDoc.data();
    // Handle createdAt - could be Timestamp, ISO string, or Date
    let createdAt: Date;
    if (data?.createdAt?.toDate) {
      createdAt = data.createdAt.toDate();
    } else if (typeof data?.createdAt === "string") {
      createdAt = new Date(data.createdAt);
    } else {
      createdAt = new Date();
    }

    return {
      ...data,
      id: quizDoc.id,
      createdAt,
    } as Quiz;
  },

  /**
   * Get all quizzes
   */
  async getAllQuizzes(): Promise<Quiz[]> {
    const snapshot = await db.collection("quizzes").get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Handle createdAt - could be Timestamp, ISO string, or Date
      let createdAt: Date;
      if (data?.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (typeof data?.createdAt === "string") {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }

      return {
        ...data,
        id: doc.id,
        createdAt,
      } as Quiz;
    });
  },

  /**
   * Update an existing quiz
   */
  async updateQuiz(
    quizId: string,
    updates: Omit<Quiz, "id" | "createdAt">
  ): Promise<Quiz> {
    const quizRef = db.collection("quizzes").doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new Error("Quiz not found");
    }

    // Get existing createdAt
    const existingData = quizDoc.data();
    let createdAt: Date;
    if (existingData?.createdAt?.toDate) {
      createdAt = existingData.createdAt.toDate();
    } else if (typeof existingData?.createdAt === "string") {
      createdAt = new Date(existingData.createdAt);
    } else {
      createdAt = new Date();
    }

    // Update quiz (preserve createdAt)
    await quizRef.update({
      name: updates.name,
      categories: updates.categories,
    });

    return {
      ...updates,
      id: quizId,
      createdAt,
    } as Quiz;
  },
};

// Game Service
export const gameService = {
  /**
   * Create a new game
   */
  async createGame(
    game: Omit<Game, "id" | "createdAt" | "updatedAt">
  ): Promise<Game> {
    const gameRef = db.collection("games").doc();
    const now = new Date();
    const newGame: Game = {
      ...game,
      id: gameRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await gameRef.set({
      ...newGame,
      createdAt: newGame.createdAt.toISOString(),
      updatedAt: newGame.updatedAt.toISOString(),
    });

    return newGame;
  },

  /**
   * Get game by ID
   */
  async getGameById(gameId: string): Promise<Game | null> {
    const gameDoc = await db.collection("games").doc(gameId).get();

    if (!gameDoc.exists) {
      return null;
    }

    const data = gameDoc.data();
    // Handle dates - could be Timestamp, ISO string, or Date
    const parseDate = (dateValue: any): Date => {
      if (dateValue?.toDate) {
        return dateValue.toDate();
      } else if (typeof dateValue === "string") {
        return new Date(dateValue);
      } else {
        return new Date();
      }
    };

    return {
      ...data,
      id: gameDoc.id,
      createdAt: parseDate(data?.createdAt),
      updatedAt: parseDate(data?.updatedAt),
      answeredQuestions: data?.answeredQuestions || [],
    } as Game;
  },

  /**
   * Get all games (optionally filtered by quizId)
   */
  async getAllGames(quizId?: string): Promise<Game[]> {
    // Fetch all games and filter/sort in memory to avoid requiring a composite index
    const snapshot = await db.collection("games").get();
    
    const parseDate = (dateValue: any): Date => {
      if (dateValue?.toDate) {
        return dateValue.toDate();
      } else if (typeof dateValue === "string") {
        return new Date(dateValue);
      } else {
        return new Date();
      }
    };

    let games = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: parseDate(data?.createdAt),
        updatedAt: parseDate(data?.updatedAt),
        answeredQuestions: data?.answeredQuestions || [],
      } as Game;
    });

    // Filter by quizId if provided
    if (quizId) {
      games = games.filter((game) => game.quizId === quizId);
    }

    // Sort by createdAt descending
    games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return games;
  },

  /**
   * Get active game (game with status "active")
   */
  async getActiveGame(): Promise<Game | null> {
    const games = await this.getAllGames();
    
    // Filter for active games, sort by createdAt descending
    const activeGames = games
      .filter((game) => game.status === "active")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Return the most recent active game
    return activeGames.length > 0 ? activeGames[0] : null;
  },

  /**
   * Activate a game (sets it to active and deactivates all others)
   */
  async activateGame(gameId: string): Promise<Game> {
    // Get all games
    const allGames = await this.getAllGames();
    
    // Set all games to "waiting" except the one being activated
    const updatePromises = allGames.map((game) => {
      if (game.id === gameId) {
        // Activate this game
        return this.updateGame(gameId, { status: "active" });
      } else if (game.status === "active") {
        // Deactivate other active games
        return this.updateGame(game.id, { status: "waiting" });
      }
      return Promise.resolve(game);
    });
    
    await Promise.all(updatePromises);
    
    // Return the activated game
    const activatedGame = await this.getGameById(gameId);
    if (!activatedGame) {
      throw new Error("Game not found after activation");
    }
    
    return activatedGame;
  },

  /**
   * Update game
   */
  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    const gameRef = db.collection("games").doc(gameId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await gameRef.update(updateData);

    const updatedGame = await this.getGameById(gameId);
    if (!updatedGame) {
      throw new Error("Game not found after update");
    }

    return updatedGame;
  },

  /**
   * Delete game
   */
  async deleteGame(gameId: string): Promise<void> {
    const gameRef = db.collection("games").doc(gameId);
    const gameDoc = await gameRef.get();
    
    if (!gameDoc.exists) {
      throw new Error("Game not found");
    }

    // Delete all contestants associated with this game
    const contestantsSnapshot = await db
      .collection("contestants")
      .where("gameId", "==", gameId)
      .get();
    
    const deleteContestantPromises = contestantsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteContestantPromises);

    // Delete the game
    await gameRef.delete();
  },
};

// Contestant Service
export const contestantService = {
  /**
   * Create a new contestant
   */
  async createContestant(
    contestant: Omit<Contestant, "id" | "createdAt">
  ): Promise<Contestant> {
    const contestantRef = db.collection("contestants").doc();
    const newContestant: Contestant = {
      ...contestant,
      id: contestantRef.id,
      createdAt: new Date(),
    };

    await contestantRef.set({
      ...newContestant,
      createdAt: newContestant.createdAt.toISOString(),
    });

    return newContestant;
  },

  /**
   * Get contestant by ID
   */
  async getContestantById(contestantId: string): Promise<Contestant | null> {
    const contestantDoc = await db
      .collection("contestants")
      .doc(contestantId)
      .get();

    if (!contestantDoc.exists) {
      return null;
    }

    const data = contestantDoc.data();
    // Handle createdAt - could be Timestamp, ISO string, or Date
    let createdAt: Date;
    if (data?.createdAt?.toDate) {
      createdAt = data.createdAt.toDate();
    } else if (typeof data?.createdAt === "string") {
      createdAt = new Date(data.createdAt);
    } else {
      createdAt = new Date();
    }

    return {
      ...data,
      id: contestantDoc.id,
      createdAt,
    } as Contestant;
  },

  /**
   * Get all contestants for a game
   */
  async getContestantsByGameId(gameId: string): Promise<Contestant[]> {
    const snapshot = await db
      .collection("contestants")
      .where("gameId", "==", gameId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Handle createdAt - could be Timestamp, ISO string, or Date
      let createdAt: Date;
      if (data?.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (typeof data?.createdAt === "string") {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date();
      }

      return {
        ...data,
        id: doc.id,
        createdAt,
      } as Contestant;
    });
  },

  /**
   * Update contestant
   */
  async updateContestant(
    contestantId: string,
    updates: Partial<Contestant>
  ): Promise<Contestant> {
    const contestantRef = db.collection("contestants").doc(contestantId);
    await contestantRef.update(updates);

    const updatedContestant = await this.getContestantById(contestantId);
    if (!updatedContestant) {
      throw new Error("Contestant not found after update");
    }

    return updatedContestant;
  },

  /**
   * Update contestant score
   */
  async updateScore(
    contestantId: string,
    points: number
  ): Promise<Contestant> {
    const contestant = await this.getContestantById(contestantId);
    if (!contestant) {
      throw new Error("Contestant not found");
    }

    const newScore = Math.max(0, contestant.score + points); // No negative scores
    return this.updateContestant(contestantId, { score: newScore });
  },

  /**
   * Delete contestant
   */
  async deleteContestant(contestantId: string): Promise<void> {
    const contestantRef = db.collection("contestants").doc(contestantId);
    const doc = await contestantRef.get();
    
    if (!doc.exists) {
      throw new Error("Contestant not found");
    }

    await contestantRef.delete();
  },
};

