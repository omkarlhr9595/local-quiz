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
    } as Game;
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
};

