import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// Public registration
router.post("/register", (req, res) => {
    res.json({ 
        message: "Delivery partner registration submitted",
        data: req.body
    });
});

// Delivery partner routes
router.get("/me", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "My delivery profile",
            data: req.user
        });
    }
);

router.patch("/me/availability", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "Availability updated",
            data: { availability: req.body.availability }
        });
    }
);

// Job routes
router.get("/jobs", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "My delivery jobs",
            data: []
        });
    }
);

router.get("/jobs/:id", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "Job details",
            data: { id: req.params.id }
        });
    }
);

router.patch("/jobs/:id/status", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "Job status updated",
            data: { jobId: req.params.id, status: req.body.status }
        });
    }
);

router.post("/jobs/:id/reject", 
    authMiddleware, 
    rbacMiddleware(Roles.DELIVERY), 
    (req, res) => {
        res.json({ 
            message: "Job rejected",
            data: { jobId: req.params.id, reason: req.body.reason }
        });
    }
);

// Admin routes
router.get("/partners", 
    authMiddleware, 
    rbacMiddleware(Roles.ANY_ADMIN), 
    (req, res) => {
        res.json({ 
            message: "All delivery partners",
            data: []
        });
    }
);

router.patch("/partners/:id/status",
    authMiddleware,
    rbacMiddleware(Roles.ANY_ADMIN),
    (req, res) => {
        res.json({ 
            message: "Partner status updated",
            data: { partnerId: req.params.id, status: req.body.status }
        });
    }
);

export default router;
